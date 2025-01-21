import { app } from '@azure/functions';

app.http('productos_lineas_consulta', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'users/{userId}/orders/{orderId?}',
    handler: async (request, context) => {
        // context.log(`Http function processed request for url "${request.url}"`);

        // const name = request.query.get('name') || await request.text() || 'world';

        const params = request.params;
        const userId = params.userId;
        const orderId = params.orderId;

        return { body: `params, ${userId}, ${orderId}` };
    }
});
