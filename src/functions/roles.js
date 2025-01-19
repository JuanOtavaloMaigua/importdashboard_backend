import { app } from '@azure/functions';
import { config } from 'dotenv';
import { verifyToken } from '../auth/authorization.js';
config();

const mainHandler = async (request, context) => {

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
});
