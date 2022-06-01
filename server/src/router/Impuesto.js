const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/list', async function (req, res) {
    try {
        // console.log(req.query)
        let lista = await conec.query(`SELECT 
        idImpuesto,
        nombre,
        porcentaje,
        codigo,
        estado,
        DATE_FORMAT(fecha,'%d/%m/%Y') as fecha, 
        hora
        FROM impuesto
        WHERE 
        ? = 0
        OR
        ? = 1 and nombre like concat(?,'%')
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

        let total = await conec.query(`SELECT COUNT(*) AS Total FROM impuesto
        WHERE 
        ? = 0
        OR
        ? = 1 and nombre like concat(?,'%')`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total })

    } catch (error) {
        console.log(error)
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.post('/add', async function (req, res) {
    let connection = null;
    try {

        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idImpuesto FROM impuesto');
        let idImpuesto = "";
        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idImpuesto.replace("IM", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'IM000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'IM00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'IM0' + incremental;
            } else {
                codigoGenerado = 'IM' + incremental;
            }

            idImpuesto = codigoGenerado;
        } else {
            idImpuesto = "IM0001";
        }

        await conec.execute(connection, `INSERT INTO impuesto(
            idImpuesto, 
            nombre,
            porcentaje,
            codigo,
            estado,
            fecha,
            hora,
            idUsuario,
            idConceptoVenta,
            idConceptoCompra) 
            VALUES(?,?,?,?,?,?,?,?,?,?)`, [
            idImpuesto,
            req.body.nombre,
            req.body.porcentaje,
            req.body.codigo,
            req.body.estado,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
            req.body.idConceptoVenta,
            req.body.idConceptoCompra
        ])

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente')
    } catch (error) {
        console.log(error)
        if (connection != null) {
            conec.rollback(connection);
        }
        res.status(500).send("Error de servidor");

    }
});

router.get('/id', async function (req, res) {
    try {
        let result = await conec.query('SELECT * FROM impuesto WHERE idImpuesto  = ?', [
            req.query.idImpuesto
        ]);

        if (result.length > 0) {
            res.status(200).send(result[0]);
        } else {
            res.status(400).send("Datos no encontrados");
        }

    } catch (error) {
        console.log(error)
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }

});

router.post('/edit', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();
        await conec.execute(connection, `UPDATE impuesto 
        SET 
        nombre=?,
        porcentaje=?,
        codigo=?,
        estado=?,
        idUsuario=?,
        idConceptoVenta=?,
        idConceptoCompra=?
        WHERE idImpuesto=?`, [
            req.body.nombre,
            req.body.porcentaje,
            req.body.codigo,
            req.body.estado,
            req.body.idUsuario,
            req.body.idConceptoVenta,
            req.body.idConceptoCompra,

            req.body.idImpuesto,

        ])

        await conec.commit(connection)
        res.status(200).send('Los datos se actualizarón correctamente.')
    } catch (error) {
        console.log(error)
        if (connection != null) {
            conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.delete('/', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let cobroDetalle = await conec.execute(connection, `SELECT * FROM cobroDetalle WHERE idImpuesto = ?`, [
            req.query.idImpuesto
        ]);

        if (cobroDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el impuesto ya que esta ligada a un detalle de cobro.')
            return;
        }

        let gastoDetalle = await conec.execute(connection, `SELECT * FROM gastoDetalle WHERE idImpuesto = ?`, [
            req.query.idImpuesto
        ]);

        if (gastoDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el impuesto ya que esta ligada a un detalle de gasto.')
            return;
        }

        let ventaDetalle = await conec.execute(connection, `SELECT * FROM ventaDetalle WHERE idImpuesto = ?`, [
            req.query.idImpuesto
        ]);

        if (ventaDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el impuesto ya que esta ligada a un detalle de venta.')
            return;
        }

        await conec.execute(connection, `DELETE FROM impuesto WHERE idImpuesto   = ?`, [
            req.query.idImpuesto
        ]);

        await conec.commit(connection)
        res.status(200).send('Se eliminó correctamente el impuesto.')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/listcombo', async function (req, res) {
    try {
        let result = await conec.query('SELECT idImpuesto,nombre,porcentaje	 FROM impuesto');
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});


module.exports = router;