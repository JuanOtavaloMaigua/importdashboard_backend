import { app } from '@azure/functions';
import { config } from 'dotenv';
// import jwksClient from 'jwks-rsa';
// import jwt from 'jsonwebtoken';
import { verifyToken } from '../auth/authorization.js';
config();

// const client = jwksClient({
//     jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
// });
  
// function getKey(header, callback) {
//     if(!header.kid) {
//         return callback(new Error('No kid in header'));
//     }
//     client.getSigningKey(header.kid, (err, key) => {
//         if (err) {
//         callback(err, null);
//         } else {
//         const signingKey = key.getPublicKey(); 
//         // context.log('signing key: ', signingKey)
//         callback(null, signingKey);
//         }
//     });
// }

// const verifyToken = async (request, context, next) => {
//     const authHeader = request.headers.get('x-custom-header')
//     if (!authHeader) {
//         return {
//             status: 401,
//             message: 'Authorization header missing'
//         }
//     }
//     const token = authHeader.split(' ')[1];

//     if (!token) {
//         return {
//             status: 401,
//             message: 'Token missing'
//         }
//     }

//     try{
//         const verifyJWT = await new Promise((resolve, reject) => {
//             jwt.verify(
//               token,
//               getKey,
//               {
//                 audience: process.env.AUTH0_API_AUDIENCE,
//                 issuer: `https://${process.env.AUTH0_DOMAIN}/`,
//                 algorithms: ["RS256"],
//                 complete: true
//               },
//               (err, decoded) => {
//                 if (err) reject(err);
//                 else resolve(decoded);
//               }
//             );
//           }).then((result)=>{
//             return {decoded: result}
//           }).catch((error)=>{  
//             return {error}
//           });
        
//         if(verifyJWT['error']){
//             return {
//                 status: 500,
//                 body: JSON.stringify(verifyJWT['error'])
//             }
//         }
//         context.user = verifyJWT['decoded']
//     }catch(error){
//         context.log('error: ', error)
//     }

//     return next();
// };

const mainHandler = async (req, context) => {
    // const userId = context.user
    // context.log('---userId: ', userId)

    const userInfo = context.user
    const allRoles = userInfo?.payload[`${process.env.AUTH0_API_AUDIENCE}/claims/roles`]
    const allPermissions = userInfo?.payload.permissions

    context.log('all roles: ', allRoles)
    context.log('all permissions: ', allPermissions)

    return {status: 200, body: JSON.stringify({allRoles, allPermissions})};
};

const withMiddleware = (...middlewares) => (request, context) => {
    const chain = middlewares.reduceRight(
        (next, middleware) => () => middleware(request, context, next),
        () => mainHandler(request, context)
    );
    return chain();
};


app.http('roles', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: withMiddleware(verifyToken)
    // handler: async (request, context) => {
    //     try {
    //         // Get the raw body as text first
    //         const rawBody = await request.text();
    //         context.log('Raw body:', rawBody);
            
    //         let parsedBody;
    //         try {
    //             // Try to parse as JSON if possible
    //             parsedBody = JSON.parse(rawBody);
    //         } catch {
    //             // If not JSON, use the raw text
    //             parsedBody = rawBody;
    //         }

    //         const headers = {};
    //         for (const [key, value] of request.headers.entries()) {
    //             headers[key] = value;
    //         }
            
    //         // Get specific header
    //         const customHeader = request.headers.get('x-custom-header');
    //         context.log('Custom header:', customHeader);
            
    //         return {
    //             body: `${JSON.stringify(parsedBody)}   cheader :${customHeader}`,
    //         };
    //     } catch (error) {
    //         context.log('Error:', error);
    //         return {
    //             status: 500,
    //             body: {
    //                 message: "Error processing request",
    //                 error: error.message
    //             }
    //         };
    //     }
    // }
});
