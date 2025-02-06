import { app } from "@azure/functions"
import { verifyToken } from "../auth/authorization.js";

const mainHandler = async (request, context) => {
    const bodyData = await request.json();
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

        const lineas = await fetch(`${perseoApiUrl}productos_lineas_consulta`, requestOptions)
        const lineasJson = await lineas.json()

        const categorias = await fetch(`${perseoApiUrl}productos_categorias_consulta`, requestOptions)
        const categoriasJson = await categorias.json()

        const subcategorias = await fetch(`${perseoApiUrl}productos_subcategorias_consulta`, requestOptions)
        const subcategoriasJson = await subcategorias.json()
        // productos_subgrupos_consulta

        const subgrupos = await fetch(`${perseoApiUrl}productos_subgrupos_consulta`, requestOptions)
        const subgruposJson = await subgrupos.json()

        // medidas_consulta
        const medidas = await fetch(`${perseoApiUrl}medidas_consulta`, requestOptions)
        const medidasJson = await medidas.json()

        // context.log('lineas json: ', lineasJson)

        const response = await fetch(`${perseoApiUrl}productos_consulta`, requestOptions)
        const data = await response.json()
        const productos = data["productos"][0]

        const productos_lineasid = productos["productos_lineasid"]
        const productos_categoriasid = productos["productos_categoriasid"]
        const productos_subcategoriasid = productos["productos_subcategoriasid"]
        const productos_subgruposid = productos["productos_subgruposid"]
        const unidadinterna = productos["unidadinterna"]

        const lineasDescripcion = lineasJson["lineas"].find((lineaObj)=> lineaObj["productos_lineasid"] === productos_lineasid)?.descripcion
        const categoriaDescripcion = categoriasJson["categorias"].find((categoriaObj)=> categoriaObj["productos_categoriasid"] === productos_categoriasid)?.descripcion
        const subcategoriaDescripcion = subcategoriasJson["subcategorias"].find((subcategoriaObj)=> subcategoriaObj["productos_subcategoriasid"] === productos_subcategoriasid)?.descripcion
        const subgrupoDescripcion = subgruposJson["subgrupo"].find((subgrupoObj)=> subgrupoObj["productos_subgruposid"] === productos_subgruposid)?.descripcion
        const unidadInternaDescripcion = medidasJson["medidas"].find((medidaObj)=> medidaObj["medidasid"] === unidadinterna)?.descripcion

        // const newProducts = {}
        productos["productos_lineasid"] = lineasDescripcion
        productos["productos_categoriasid"] = categoriaDescripcion
        productos["productos_subcategoriasid"] = subcategoriaDescripcion
        productos["productos_subgruposid"] = subgrupoDescripcion
        productos["unidadinterna"] = unidadInternaDescripcion
        // newProducts["barras"] = productos["barras"]
        // newProducts["descripcion"] = productos["descripcion"]
        // newProducts["existenciastotales"] = productos["existenciastotales"]
        // newProducts["tarifas"] = productos["tarifas"]

        // context.log('productos: ')
        // context.log(newProducts)
        
        return {
            status: 200,
            body: JSON.stringify([productos])
        }
    } catch (error) {
        context.log(error)
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
});
