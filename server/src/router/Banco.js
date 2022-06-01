const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const { decrypt } = require('../tools/CryptoJS');

const Banco = require('../services/Banco');
const Sede = require('../services/Sede');
const RepFinanciero = require('../report/RepFinanciero');

const banco = new Banco();
const sede = new Sede();
const repFinanciero = new RepFinanciero();

const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/list', async function (req, res) {
    try {
        let lista = await conec.query(`SELECT 
        b.idBanco, 
        b.nombre, 
        CASE 
        WHEN b.tipoCuenta = 1 THEN 'Banco'
        WHEN b.tipoCuenta = 2 THEN 'Tarjeta'
        ELSE 'Efectivo' END AS 'tipoCuenta',
        m.nombre as moneda,
        m.codiso,
        b.numCuenta,
        b.cci,
        IFNULL(SUM(CASE WHEN bd.tipo = 1 THEN bd.monto ELSE -bd.monto END),0)AS saldo
        FROM banco AS b 
        INNER JOIN moneda AS m ON m.idMoneda = b.idMoneda 
        LEFT JOIN bancoDetalle AS bd ON bd.idBanco = b.idBanco 
        WHERE 
        ? = 0
        OR
        ? = 1 and b.nombre like concat(?,'%')
        GROUP BY b.idBanco
        LIMIT ?,?`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
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
        FROM banco AS b INNER JOIN moneda AS m
        ON m.idMoneda = b.idMoneda 
        WHERE 
        ? = 0
        OR
        ? = 1 and b.nombre like concat(?,'%')`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total });
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.post('/add', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idBanco FROM banco');
        let idBanco = "";
        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idBanco.replace("BC", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'BC000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'BC00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'BC0' + incremental;
            } else {
                codigoGenerado = 'BC' + incremental;
            }

            idBanco = codigoGenerado;
        } else {
            idBanco = "BC0001";
        }

        await conec.execute(connection, `INSERT INTO banco(
        idBanco,
        nombre,
        tipoCuenta,
        idMoneda,
        numCuenta,
        cci, 
        fecha,
        hora,
        idUsuario) 
        values (?,?,?,?,?,?,?,?,?)`, [
            idBanco,
            req.body.nombre,
            req.body.tipoCuenta,
            req.body.idMoneda,
            req.body.numCuenta,
            req.body.cci,
            req.body.representante,
            currentDate(),
            currentTime(),
            req.body.idUsuario
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente');
    } catch (err) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send(error);
    }
});

router.post('/update', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        await conec.execute(connection, `UPDATE banco SET 
        nombre=?, 
        tipoCuenta=?, 
        idMoneda=?, 
        numCuenta=?, 
        cci=?, 
        fecha=?,
        hora=?,
        idUsuario=?
        WHERE idBanco=?`, [
            req.body.nombre,
            req.body.tipoCuenta,
            req.body.idMoneda,
            req.body.numCuenta,
            req.body.cci,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
            req.body.idBanco
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos actulizados correctamente');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send(error);
    }
});

router.get('/id', async function (req, res) {
    try {
        let result = await conec.query('SELECT * FROM banco WHERE idBanco = ?', [
            req.query.idBanco,
        ]);

        if (result.length > 0) {
            res.status(200).send(result[0]);
        } else {
            res.status(400).send("Datos no encontrados");
        }
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.delete('/', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let cobro = await conec.execute(connection, `SELECT * FROM cobro WHERE idBanco = ?`, [
            req.query.idBanco
        ]);

        if (cobro.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el banco ya que esta ligada a un cobro.')
            return;
        }

        let gasto = await conec.execute(connection, `SELECT * FROM gasto WHERE idBanco = ?`, [
            req.query.idBanco
        ]);

        if (gasto.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el banco ya que esta ligada a un gasto.')
            return;
        }

        await conec.execute(connection, `DELETE FROM banco WHERE idBanco = ?`, [
            req.query.idBanco
        ]);

        await conec.commit(connection);
        res.status(200).send('Se eliminó correctamente el banco.');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/listcombo', async function (req, res) {
    try {
        let result = await conec.query('SELECT idBanco, nombre, tipoCuenta FROM banco');
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/detalle', async function (req, res) {
    const result = await banco.detalleBanco(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/repdetallebanco', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');

    req.query.idBanco = decryptedData.idBanco;
    req.query.idSede = decryptedData.idSede;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await banco.detalleBanco(req)

    if (typeof detalle === 'object') {

        let data = await repFinanciero.repDetalleBanco(sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=REPORTE DE CAJA BANCO AL ${currentDate()}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }

    } else {
        res.status(500).send(detalle);
    }
});


module.exports = router;