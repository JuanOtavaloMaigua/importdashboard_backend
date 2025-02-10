import { app } from "@azure/functions"
import { verifyToken } from "../auth/authorization.js";
import { database } from '../../config/database.js';
import { config } from 'dotenv';

config();
const db = await database.connect();

const mainHandler = async (request, context)=>{
    const bodyData = await request.json();
    const { userId = "", tableData = [], exported = "" } = bodyData;

    context.log('bodyData: ', bodyData)
    try{
        const collection = db.collection("transferencias");

        if(!userId){
            return {
                status: 400,
                jsonBody: {
                    error: "Falta el ID del usuario"
                }
            };
        }

        const lastDocumentId = await collection.findOne(
            { userId, exported: false},
            { sort: { _id: -1 } }
        );

        const documentId = lastDocumentId?.documentId
        
        context.log('lastDocumentId: ', lastDocumentId)

        if(!lastDocumentId){
            // const currentDocumentId = documentId ? parseInt(documentId) + 1 : 1; 
            // context.log('currentDocumentId: ', currentDocumentId)
            const totalCount = await collection.countDocuments();
            const currentDocumentId = totalCount + 1
            const newDocument = {
                userId,
                tableData,
                exported,
                createdAt: new Date(),
                updatedAt: new Date(),
                documentId: currentDocumentId,
            }
            context.log('newDocument: ', newDocument)
            const result = await collection.insertOne(newDocument);
            
            context.log('Created new document with collectionId:', documentId);
            
            return {
                status: 201,
                jsonBody: {
                    message: "Datos actualizados correctamente",
                    documentId: currentDocumentId,
                    documentId: result.insertedId
                }
            };
        }

        // const lastDocumentExported = lastDocumentId.exported

        if(lastDocumentId && !exported){
            const updateResult = await collection.findOneAndUpdate(
                { 
                    documentId: documentId,
                    userId: userId  // Ensure user owns the document
                },
                {
                    $set: {
                        tableData,
                        updatedAt: new Date()
                    }
                },
                {
                    returnDocument: 'after'  // Return the updated document
                }
            );

            return {
                status: 200,
                jsonBody: {
                    message: "Datos actualizados correctamente",
                    documentId: documentId,
                    document: updateResult.value
                }
            };
        }

        if(lastDocumentId && exported){
            const updateResult = await collection.findOneAndUpdate(
                { 
                    documentId: documentId,
                    userId: userId  // Ensure user owns the document
                },
                {
                    $set: {
                        // tableData,
                        updatedAt: new Date(),
                        exported
                    }
                },
                {
                    returnDocument: 'after'  // Return the updated document
                }
            );

            return {
                status: 200,
                jsonBody: {
                    message: "Datos actualizados correctamente",
                    documentId: documentId,
                    document: updateResult.value
                }
            };
        }


    }catch(error){
        return {
            status: 500,
            jsonBody: {
                error: "Error interno del servidor",
                message: error.message
            }
        };
    }
}

const withMiddleware = (...middlewares) => (request, context) => {
    const chain = middlewares.reduceRight(
        (next, middleware) => () => middleware(request, context, next),
        () => mainHandler(request, context)
    );
    return chain();
};

app.http('save_transferencias', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: withMiddleware(verifyToken)
});
