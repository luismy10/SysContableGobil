const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const { decrypt } = require('../tools/CryptoJS');

const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/list', async function (req, res) {
    try {

        let lista = await conec.query(`SELECT 
            idAsiento,
            idComprobante,
            idPersona,
            idUsuario,
            serie,
            numeracion,
            correlativo,
            total,
            observacion,
            tipo,
            estado,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha, 
            hora
            FROM asiento
            WHERE
            ? = 0
            OR
            ? = 1 AND correlativo like concat(?,'%')
            ORDER BY fecha DESC , hora DESC
            LIMIT ?,?`, [
            req.query.opcion,

            req.query.opcion,
            req.query.buscar,

            parseInt(req.query.posicionPagina),
            parseInt(req.query.filasPorPagina)
        ])

        let resultLista = lista.map(function (item, index) {
            return {
                ...item,
                id: (index + 1) + parseInt(req.query.posicionPagina)
            }
        });

        let total = await conec.query(`SELECT COUNT(*) AS Total 
            FROM asiento
            WHERE 
            ? = 0
            OR
            ? = 1 AND correlativo like concat(?,'%')`, [
            req.query.opcion,

            req.query.opcion,
            req.query.buscar
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total });

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.post('/add', async function (req, res) {
    console.log(req.body)
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idAsiento FROM asiento');
        let idAsiento = "";
        let correlativo = "";

        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idAsiento.replace("AS", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'AS000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'AS00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'AS0' + incremental;
            } else {
                codigoGenerado = 'AS' + incremental;
            }

            idAsiento = codigoGenerado;
            correlativo = incremental;
        } else {
            idAsiento = "AS0001";
            correlativo = 1;
        }

        await conec.execute(connection, `INSERT INTO asiento(
            idAsiento,
            idComprobante,
            idPersona,
            idUsuario,
            serie,
            numeracion,
            correlativo,
            total,
            observacion,
            tipo,
            estado,
            fecha,
            hora) 
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            idAsiento,
            req.body.idComprobante,
            req.body.idPersona,
            req.body.idUsuario,
            req.body.serie,
            req.body.numeracion,
            correlativo,
            parseFloat(req.body.total),
            req.body.observacion,
            req.body.tipo,
            req.body.estado,
            req.body.fecha,
            currentTime(),
        ]);

        for (let item of req.body.detalle) {
            await conec.execute(connection, `INSERT INTO asientoDetalle(
                idAsiento, 
                idConcepto,
                descripcion,
                debito, 
                credito)
                VALUES(?,?,?,?,?)`, [
                idAsiento,
                item.idConcepto,
                item.descripcion.toUpperCase(),
                item.debito === '' ? 0 : parseFloat(item.debito),
                item.credito === '' ? 0 : parseFloat(item.credito)
            ]);

        }

        await conec.commit(connection);
        res.status(200).send('Datos registrados correctamente.');
    } catch (error) {
        console.log(error);
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.get('/detalle', async function (req, res) {
    try {

        let result = await conec.query(`SELECT
            a.idAsiento,

            com.nombre AS comprobante,
 
            c.documento,
            c.informacion,

            u.nombres AS nomUsuario,
            u.apellidos AS apeUsuario,

            a.serie,
            a.numeracion,
            a.correlativo,
            a.total,
            a.observacion,
            a.tipo, 
            a.estado,
            DATE_FORMAT(a.fecha,'%d/%m/%Y') as fecha,
            a.hora

            FROM asiento AS a 

            LEFT JOIN comprobante AS com ON a.idComprobante = com.idComprobante
            LEFT JOIN cliente AS c ON a.idPersona = c.idCliente
            LEFT JOIN usuario AS u ON a.idUsuario = u.idUsuario
            LEFT JOIN asientoDetalle AS ad ON a.idAsiento = ad.idAsiento 

            WHERE a.idAsiento = ?
            GROUP BY a.idAsiento`, [
            req.query.idAsiento
        ]);



        if (result.length > 0) {
            let detalle = await conec.query(`SELECT 
                conp.codigo, 
                conp.nombre, 
                ad.descripcion,
                ad.debito,
                ad.credito
                FROM asientoDetalle AS ad 
                INNER JOIN concepto AS conp ON ad.idConcepto = conp.idConcepto

                WHERE idAsiento = ? `, [
                req.query.idAsiento
            ]);

            res.status(200).send({ "cabecera": result[0], "detalle": detalle });
        } else {
            res.status(400).send('Datos no encontrados')
        }
    } catch (error) {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
})

// ASIENTO LIBRO DIARIO
router.get('/librodiario', async function (req, res) {
    try {

        let result = await conec.query(`SELECT
            a.idAsiento,

            com.nombre AS comprobante,
 
            c.documento,
            c.informacion,

            a.serie,
            a.numeracion,
            a.correlativo,
            a.total,
            a.observacion,
            a.tipo, 
            a.estado,
            DATE_FORMAT(a.fecha,'%d/%m/%Y') as fecha,
            a.hora

            FROM asiento AS a 
            LEFT JOIN comprobante AS com ON a.idComprobante = com.idComprobante
            LEFT JOIN cliente AS c ON a.idPersona = c.idCliente
            LEFT JOIN asientoDetalle AS ad ON a.idAsiento = ad.idAsiento 

            WHERE 
            ? = 0 AND a.fecha BETWEEN ? AND ?
            OR
            ? = 1 AND a.fecha BETWEEN ? AND ?
            GROUP BY a.idAsiento`, [
            req.query.tipoRegistro,
            req.query.fechaIni,
            req.query.fechaFin,

            req.query.tipoRegistro,
            req.query.fechaIni,
            req.query.fechaFin
        ]);

        if (result.length > 0) {

            let detalle = []

            for (let item of result) {
                let query = await conec.query(`SELECT 
                    ad.idAsiento,
                    conp.codigo, 
                    conp.nombre, 
                    ad.debito,
                    ad.credito
                    FROM asientoDetalle AS ad 
                    INNER JOIN concepto AS conp ON ad.idConcepto = conp.idConcepto
                    WHERE idAsiento=?`, [
                    item.idAsiento
                ]);

                detalle.push(...query)
            }

            res.status(200).send({ "asiento": result, "asientoDet": detalle });

        } else {
            console.log(result)
            res.status(400).send('Datos no encontrados')
        }

    } catch (error) {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
        console.log(error);
    }
});

module.exports = router;