import { app } from "@azure/functions"
import { verifyToken } from "../auth/authorization.js";

const mainHandler = async (request, context) => {

    // const producto = request.params
    const bodyData = await request.json();
    // context.log('product: ', bodyData)
    const { productocodigo= "" , barras=""} = bodyData
    const perseoApiUrl = process.env.PERSEO_API_URL
    const perseoApiKey = process.env.PERSEO_API_KEY

    const body = {
        api_key: perseoApiKey,
        ...(productocodigo && { productocodigo }),
        ...(barras && { barras })
    };

    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        // TODO: i have to use this api so many times, cursor say that is better to create a utility function
        body: JSON.stringify(body)
    };

    try {
        const response = await fetch(`${perseoApiUrl}productos_consulta`, requestOptions)
        const data = await response.json()
        const productos = data["productos"]
        context.log('data: ', data)
        
        return {
            status: 200,
            body: JSON.stringify(productos)
        }
    } catch (error) {
        // console.error(error)
        return {
            status: 500,
            body: JSON.stringify({"error": error})
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

app.http('productos_consulta', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: withMiddleware(verifyToken)
    // handler: async (request, context) => {
    //     context.log(`Http function processed request for url "${request.url}"`);

    //     const name = request.query.get('name') || await request.text() || 'world';

    //     return { body: `Hello, ${name}!` };
    // }
});
