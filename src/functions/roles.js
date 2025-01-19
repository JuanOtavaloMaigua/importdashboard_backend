import { app } from '@azure/functions';

app.http('roles', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Get the raw body as text first
            const rawBody = await request.text();
            context.log('Raw body:', rawBody);
            
            let parsedBody;
            try {
                // Try to parse as JSON if possible
                parsedBody = JSON.parse(rawBody);
            } catch {
                // If not JSON, use the raw text
                parsedBody = rawBody;
            }

            const headers = {};
            for (const [key, value] of request.headers.entries()) {
                headers[key] = value;
            }
            
            // Get specific header
            const customHeader = request.headers.get('x-custom-header');
            context.log('Custom header:', customHeader);
            
            return {
                body: `${JSON.stringify(parsedBody)}   cheader :${customHeader}`,
            };
        } catch (error) {
            context.log('Error:', error);
            return {
                status: 500,
                body: {
                    message: "Error processing request",
                    error: error.message
                }
            };
        }
    }
});
