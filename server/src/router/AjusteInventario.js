const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const { decrypt } = require('../tools/CryptoJS');

const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/list', async function (req, res) {

    try {
        let lista = await conec.query(`SELECT
            ai.idAjusteInventario,
            al.nombre AS almacen,
            CONCAT(u.nombres, ' ', u.apellidos) AS usuarioRegistro,
            ai.correlativo,
            ai.total,
            DATE_FORMAT(ai.fecha,'%d/%m/%Y') as fecha, 
            ai.hora,
            ai.estado,
            ai.observacion
            FROM ajusteInventario AS ai
            INNER JOIN almacen AS al ON ai.idAlmacen = al.idAlmacen
            INNER JOIN usuario AS u ON ai.idUsuario = u.idUsuario
            WHERE 
            ? = 0
            OR
            ? = 1 AND ai.correlativo LIKE CONCAT(?,'%')
            ORDER BY ai.fecha desc, ai.hora desc
            LIMIT ?,?
            `, [
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
            FROM ajusteInventario AS ai
            INNER JOIN almacen AS al ON ai.idAlmacen = al.idAlmacen
            INNER JOIN usuario AS u ON ai.idUsuario = u.idUsuario
            WHERE 
            ? = 0
            OR
            ? = 1 AND ai.correlativo LIKE CONCAT(?,'%')`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total })

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
        console.log()
    }
});

router.post('/add', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idAjusteInventario FROM ajusteInventario');
        let idAjusteInventario = "";
        let correlativo = ''

        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idAjusteInventario.replace("AI", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'AI000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'AI00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'AI0' + incremental;
            } else {
                codigoGenerado = 'AI' + incremental;
            }

            idAjusteInventario = codigoGenerado;
            correlativo = incremental;
        } else {
            idAjusteInventario = "AI0001";
            correlativo = 1;
        }

        await conec.execute(connection, `INSERT INTO ajusteInventario(
            idAjusteInventario,
            idAlmacen,
            idUsuario,
            correlativo,
            total,
            fecha,
            hora,
            estado,
            observacion) values (?,?,?,?,?,?,?,?,?)`, [
            idAjusteInventario,
            req.body.idAlmacen,
            req.body.idUsuario,
            parseInt(correlativo),
            parseFloat(req.body.total),
            req.body.fecha,
            currentTime(),
            req.body.estado,
            req.body.observacion,
        ]);

        for (let item of req.body.ajusteDetalle) {
            await conec.execute(connection, `INSERT INTO ajusteInventarioDetalle(
                idAjusteInventario,
                idProducto,
                cantidadActual,
                tipoAjuste,
                cantidad,
                costo,
                cantidadFinal,
                totalAjuste)
                VALUES(?,?,?,?,?,?,?,?)`, [
                idAjusteInventario,
                item.idProducto,
                parseFloat(item.cantidadActual),
                parseInt(item.tipoAjuste),
                parseFloat(item.cantidad),
                parseFloat(item.costo),
                parseFloat(item.cantidadFinal),
                parseFloat(item.totalAjuste)
            ])

            let cantidad = item.tipoAjuste === '1' ? item.cantidad : -item.cantidad;

            // console.log(cantidad)

            await conec.execute(connection, `UPDATE cantidad 
                SET cantidad=cantidad+(?)
                WHERE idProducto = ? AND idAlmacen=?`, [
                parseFloat(cantidad),
                item.idProducto,
                req.body.idAlmacen
            ])
        }

        console.log("----")

        // await conec.rollback(connection)
        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente');

    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection)
        }
        console.log(error)
        res.status(500).send('Error interno de conexión, intente nuevamente.')
    }
});

router.get('/id', async (req, res) => {
    try{
        let result = await conec.query(`SELECT
            ai.idAjusteInventario,
            al.nombre AS almacen,
            CONCAT(u.nombres, ' ', u.apellidos) AS usuarioRegistro,
            ai.correlativo,
            ai.total,
            DATE_FORMAT(ai.fecha,'%d/%m/%Y') as fecha, 
            ai.hora,
            ai.estado,
            ai.observacion
            FROM ajusteInventario AS ai
            INNER JOIN almacen AS al ON ai.idAlmacen = al.idAlmacen
            INNER JOIN usuario AS u ON ai.idUsuario = u.idUsuario  
            WHERE ai.idAjusteInventario = ?`, [
            req.query.idAjusteInventario
        ]);

        if (result.length > 0) {
            let detalle = await conec.query(`SELECT 
            prod.codigo,
            prod.nombre AS producto,
            aid.cantidadActual,
            aid.tipoAjuste,
            aid.cantidad,
            aid.costo,
            aid.cantidadFinal,
            aid.totalAjuste
            FROM ajusteInventarioDetalle AS aid
            INNER JOIN producto AS prod ON aid.idProducto = prod.idProducto
            WHERE idAjusteInventario = ? `, [
                req.query.idAjusteInventario
            ]);
            res.status(200).send({ "cabecera": result[0], "detalle": detalle });
        } else {
            res.status(400).send("Datos no encontrados");
        }

    } catch(error){
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }

});

module.exports = router;
