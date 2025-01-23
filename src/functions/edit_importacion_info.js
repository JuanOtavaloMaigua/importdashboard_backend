import { app } from '@azure/functions';
import { config } from 'dotenv';
import { verifyToken } from '../auth/authorization.js';
import { database } from '../../config/database.js';

config();
const db = await database.connect();

const mainHandler = async (request, context) => {
    const params = request.params;
    const userId = params.userId;
    const bodyData = await request.json();
    context.log('bodyData: ', bodyData);    
    let { infoData={}, documentId = 0 } = bodyData;

    try {
        const collection = db.collection("compras");
        
        // Validate required data
        if (!infoData.length) {
            return {
                status: 400,
                body: JSON.stringify({
                    "error": "infoData is required"
                })
            };
        }

        let result;
        
        if (!documentId) {
            // Create new document with next collectionId
            const lastDocumentId = await collection.find()
                .sort({'documentId': -1})
                .limit(1)
                .toArray();
            
            documentId = lastDocumentId.length > 0 ? lastDocumentId[0].documentId + 1 : 1;

            const newDocument = {
                importacionInfo: infoData,
                documentId: documentId,
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            result = await collection.insertOne(newDocument);
            
            context.log('Created new document with collectionId:', docuemntId);
            
            return {
                status: 201,
                jsonBody: {
                    message: "Document created successfully",
                    collectionId: documentId,
                    documentId: result.insertedId
                }
            };
        } else {
            // Update existing document
            const updateResult = await collection.findOneAndUpdate(
                { 
                    documentId: documentId,
                    userId: userId  // Ensure user owns the document
                },
                {
                    $set: {
                        importacionInfo: infoData,
                        updatedAt: new Date()
                    }
                },
                {
                    returnDocument: 'after'  // Return the updated document
                }
            );

            context.log('update rresult: ', updateResult);

            if (!updateResult._id) {
                return {
                    status: 404,
                    jsonBody: {
                        error: "Document not found or unauthorized"
                    }
                };
            }

            context.log('Updated document with collectionId:', documentId);
            
            return {
                status: 200,
                jsonBody: {
                    message: "Document updated successfully",
                    collectionId: documentId,
                    document: updateResult.value
                }
            };
        }
    } catch (error) {
        context.error('Error processing request:', error);
        return {
            status: 500,
            jsonBody: {
                error: "Internal server error",
                message: error.message
            }
        };
    }
};

const withMiddleware = (...middlewares) => (request, context) => {
    const chain = middlewares.reduceRight(
        (next, middleware) => () => middleware(request, context, next),
        () => mainHandler(request, context)
    );
    return chain();
};

app.http('edit_importacion_info', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'compras/{userId}/informacion-importacion',
    handler: withMiddleware(verifyToken)
});