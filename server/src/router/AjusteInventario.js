const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const { decrypt } = require('../tools/CryptoJS');

const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/list', async function (req, res) {

    try {
        let lista = await conec.query(`SELECT 
        prod.idProducto,
        prod.codigo,
        prod.nombre,
        prod.costo,

        imp.nombre AS impuesto,
        
        cant.cantidad,
        med.nombre AS medida,

        al.nombre AS almacen
        
        FROM producto AS prod
        INNER JOIN impuesto AS imp ON prod.idImpuesto = imp.idImpuesto
        INNER JOIN medida AS med ON prod.idMedida = med.idMedida
        LEFT JOIN almacen AS al ON prod.idAlmacen = al.idAlmacen
        LEFT JOIN cantidad AS cant ON cant.idProducto = prod.idProducto
        WHERE 
        ? = 0
        OR
        ? = 1 AND prod.nombre LIKE CONCAT(?,'%')
        LIMIT ?,?`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.posicionPagina),
            parseInt(req.query.filasPorPagina)
        ]);

        let resultLista = lista.map(function (item, index) {
            return {
                ...item,
                id: (index + 1) + parseInt(req.query.posicionPagina)
            }
        });

        let total = await conec.query(`SELECT COUNT(*) AS Total        
            FROM producto AS prod
            INNER JOIN impuesto AS imp ON prod.idImpuesto = imp.idImpuesto
            INNER JOIN medida AS med ON prod.idMedida = med.idMedida
            LEFT JOIN almacen AS al ON prod.idAlmacen = al.idAlmacen
            LEFT JOIN cantidad AS cant ON cant.idProducto = prod.idProducto
            WHERE 
            ? = 0
            OR
            ? = 1 AND prod.nombre LIKE CONCAT(?,'%')`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total })

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});
