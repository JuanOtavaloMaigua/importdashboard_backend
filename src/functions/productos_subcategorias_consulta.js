// const { app } = require('@azure/functions');
import { app } from '@azure/functions';
import axios from 'axios';
import { config } from 'dotenv';

config();

app.http('productos_subcategorias_consulta', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        const perseoApiUrl = process.env.PERSEO_API_URL
        const perseoApiKey = process.env.PERSEO_API_KEY

        // try{
        //     const response = await axios.post(`${perseoApiUrl}productos_subcategorias_consulta`, {
        //         body: {
        //             'api_key': perseoApiKey
        //         }
        //     })
        //     return {
        //         status: 200,
        //         body: JSON.stringify(response.data)
        //     }

        // }catch(error){
        //     return {
        //         status: 500,
        //         body: JSON.stringify(error)
        //     }
        // }
        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            // TODO: i have to use this api so many times, cursor say that is better to create a utility function
            body: JSON.stringify({"api_key": perseoApiKey})
        };
    
        // console.log('api key: ', API_KEY)
    
        try {
            const response = await fetch(`${perseoApiUrl}productos_subcategorias_consulta`, requestOptions)
            const data = await response.json()
            return {
                status: 200,
                body: JSON.stringify(data)
            }
            // const articlesFromProducts = data["subcategorias"]
            // const dropdownArticlesType = articlesFromProducts
            //                                     .map((productObject)=>({'label': productObject.descripcion, 
            //                                                                 'id': productObject.descripcion, 
            //                                                                 'value': productObject.descripcion}))
            // return dropdownArticlesType
        } catch (error) {
            console.error(error)
        }



    }
});
