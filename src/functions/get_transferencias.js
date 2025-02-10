import { app } from '@azure/functions';
import { config } from 'dotenv';
import { verifyToken } from '../auth/authorization.js';
import { database } from '../../config/database.js';

config();
const db = await database.connect();

const mainHandler = async (request, context)=>{
    const params = request.params;
    const userId = params.userId;

    try {
        const collection = db.collection("transferencias");
        if (!userId) {
            return {
                status: 400,
                body: JSON.stringify({
                    "error": "error en userId"
                })
            };
        }


        const document = await collection.findOne(
            { userId: userId , exported: false},
            { 
                sort: { documentId: -1 },  // Sort by documentId in descending order
                projection: { tableData: 1, _id: 0 }  // Only return the documentId field
            }
        );
        // const document = await collection.find({ userId: userId })
        // .sort({ documentId: -1 })  // Sort by documentId in descending order
        // .toArray();

        context.log('document: ', document)

        if(!document){
            return {
                status: 200,
                jsonBody: {
                    message: "Ingrese Datos",
                    tableData: []
                }
            }
        }

        if(document){
            return {
                status: 200,
                jsonBody: {
                    message: "Datos Cargados",
                    tableData: document.tableData
                }
            }
        }



    }catch(error){
        return {
            status: 500,
            body: JSON.stringify({ "error": error })
        }
    }
}

const withMiddleware = (...middlewares) => (request, context) => {
    const chain = middlewares.reduceRight(
        (next, middleware) => () => middleware(request, context, next),
        () => mainHandler(request, context)
    );
    return chain();
};

app.http('get_transferencias', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'transferencias/{userId}',
    handler: withMiddleware(verifyToken)
});
