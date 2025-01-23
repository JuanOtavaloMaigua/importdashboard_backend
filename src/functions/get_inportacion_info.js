import { app } from '@azure/functions';
import { config } from 'dotenv';
import { verifyToken } from '../auth/authorization.js';
import { database } from '../../config/database.js';

config();
const db = await database.connect();

const mainHandler = async (request, context) => {

    const params = request.params;
    // const userId = params.userId;
    // const simple = params.documentId
    const documentId1 = parseInt(params.documentId)

    try{
        const collection = db.collection("compras");
        const queryResult = documentId1 
                                ? await collection.find({'documentId': documentId1}).toArray()
                                : await collection.find().sort({'documentId': -1}).limit(1).toArray()
        const resultData = queryResult[0]
        const importacionData = resultData.importacionDatos || []
        const importacionInfo = resultData.importacionInfo || []
        const documentId = resultData.documentId
        return {
            status: 200,
            body: JSON.stringify({importacionData, importacionInfo, documentId})
        }
    }catch(error){
        return {
            status: 500,
            body: JSON.stringify({"error": error})
        }
    }
};

const withMiddleware = (...middlewares) => (request, context) => {
    const chain = middlewares.reduceRight(
        (next, middleware) => () => middleware(request, context, next),
        () => mainHandler(request, context)
    );
    return chain();
};

app.http('get_inportacion_info', {
    methods: ['GET'],
    authLevel: 'anonymous', 
    route: 'compras/{userId}/informacion-importacion/document/{documentId}',
    handler: withMiddleware(verifyToken)
});
