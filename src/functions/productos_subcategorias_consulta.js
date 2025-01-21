// const { app } = require('@azure/functions');
import { app } from '@azure/functions';
import axios from 'axios';
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
        const response = await fetch(`${perseoApiUrl}productos_subcategorias_consulta`, requestOptions)
        const data = await response.json()
        return {
            status: 200,
            body: JSON.stringify(data)
        }
    } catch (error) {
        console.error(error)
    }

};

const withMiddleware = (...middlewares) => (request, context) => {
    const chain = middlewares.reduceRight(
        (next, middleware) => () => middleware(request, context, next),
        () => mainHandler(request, context)
    );
    return chain();
};

app.http('productos_subcategorias_consulta', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: withMiddleware(verifyToken)
    // handler: async (request, context) => {

    //     const perseoApiUrl = process.env.PERSEO_API_URL
    //     const perseoApiKey = process.env.PERSEO_API_KEY
    //     const requestOptions = {
    //         method: "POST",
    //         headers: {"Content-Type": "application/json"},
    //         // TODO: i have to use this api so many times, cursor say that is better to create a utility function
    //         body: JSON.stringify({"api_key": perseoApiKey})
    //     };
    
    //     try {
    //         const response = await fetch(`${perseoApiUrl}productos_subcategorias_consulta`, requestOptions)
    //         const data = await response.json()
    //         return {
    //             status: 200,
    //             body: JSON.stringify(data)
    //         }
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }
});
