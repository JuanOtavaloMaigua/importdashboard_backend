import { app } from '@azure/functions';
import { config } from 'dotenv';
import { verifyToken } from '../auth/authorization.js';

config();

const mainHandler = async (request, context) => {
    const perseoApiUrl = process.env.PERSEO_API_URL
    const perseoApiKey = process.env.PERSEO_API_KEY
    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        // TODO: i have to use this api so many times, cursor say that is better to create a utility function
        body: JSON.stringify({"api_key": perseoApiKey})
    };

    try {
        const response = await fetch(`${perseoApiUrl}almacenes_consulta`, requestOptions)
        const data = await response.json()
        const almacenes = data["almacenes"]
        const responseDropdownFormat = almacenes
                                        .map((almacenObject)=>({"id": almacenObject.descripcion, 
                                                                "label": almacenObject.descripcion, 
                                                                "value": almacenObject.descripcion}))
        
        return {
            status: 200,
            body: JSON.stringify(responseDropdownFormat)
        }
    } catch (error) {
        // console.error(error)
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


app.http('almacenes_consulta', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: withMiddleware(verifyToken)
});
