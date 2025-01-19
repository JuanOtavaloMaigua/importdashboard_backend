import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from 'dotenv';

config();

const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});
  
function getKey(header, callback) {
    if(!header.kid) {
        return callback(new Error('No kid in header'));
    }
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
        callback(err, null);
        } else {
        const signingKey = key.getPublicKey(); 
        // context.log('signing key: ', signingKey)
        callback(null, signingKey);
        }
    });
}

const verifyToken = async (request, context, next) => {
    const authHeader = request.headers.get('x-custom-header')
    if (!authHeader) {
        return {
            status: 401,
            message: 'Authorization header missing'
        }
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
        return {
            status: 401,
            message: 'Token missing'
        }
    }

    try{
        const verifyJWT = await new Promise((resolve, reject) => {
            jwt.verify(
              token,
              getKey,
              {
                audience: process.env.AUTH0_API_AUDIENCE,
                issuer: `https://${process.env.AUTH0_DOMAIN}/`,
                algorithms: ["RS256"],
                complete: true
              },
              (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
              }
            );
          }).then((result)=>{
            return {decoded: result}
          }).catch((error)=>{  
            return {error}
          });
        
        if(verifyJWT['error']){
            return {
                status: 500,
                body: JSON.stringify(verifyJWT['error'])
            }
        }
        context.user = verifyJWT['decoded']
    }catch(error){
        context.log('error: ', error)
    }

    return next();
};

function checkPermissions(requiredPermissions) {
    const userInfo = context.user
    const allPermissions = userInfo?.payload.permissions

    
}

export { verifyToken };