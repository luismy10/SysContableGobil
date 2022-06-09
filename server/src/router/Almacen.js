
const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const { decrypt } = require('../tools/CryptoJS');

const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/list', async function (req, res) {
    try {

        let lista = await conec.query(`SELECT 
            al.idAlmacen,

            u.ubigeo,
            u.departamento,
            u.provincia,
            u.distrito,

            al.nombre,
            al.direccion,
            al.tipo,
            al.estado,
            al.sistema,
            DATE_FORMAT(al.fecha,'%d/%m/%Y') as fecha,
            al.hora
            FROM almacen AS al
            INNER JOIN ubigeo AS u ON al.idUbigeo=u.idUbigeo
            WHERE
            ? = 0
            OR
            ? = 1 AND al.nombre like concat(?,'%')
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
            FROM almacen AS al
            INNER JOIN ubigeo AS u ON al.idUbigeo=u.idUbigeo
            WHERE 
            ? = 0
            OR
            ? = 1 AND al.nombre like concat(?,'%')`, [
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

    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idAlmacen FROM almacen');

        let idAlmacen = "";

        let sistema = "";

        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idAlmacen.replace("AL", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'AL000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'AL00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'AL0' + incremental;
            } else {
                codigoGenerado = 'AL' + incremental;
            }

            idAlmacen = codigoGenerado;
            sistema = 0;

        } else {
            idAlmacen = "AL0001";
            sistema = 1;
        }

        await conec.execute(connection, `INSERT INTO almacen(
            idAlmacen,
            idUbigeo,
            idUsuario,
            nombre,
            direccion,
            tipo,
            estado,
            sistema,
            fecha,
            hora) 
            values (?,?,?,?,?,?,?,?,?,?)`, [
            idAlmacen,
            req.body.idUbigeo,
            req.body.idUsuario,
            req.body.nombre,
            req.body.direccion,
            parseInt(req.body.tipo),
            req.body.estado,
            sistema,
            currentDate(),
            currentTime(),
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");

    }
})

router.get('/id', async function (req, res) {
    try {
        let result = await conec.query(`SELECT 
            al.idAlmacen,
            al.idUbigeo,

            u.ubigeo,
            u.departamento,
            u.provincia,
            u.distrito,

            al.nombre,
            al.direccion,
            al.tipo,
            al.estado

            FROM almacen AS al
            INNER JOIN ubigeo AS u ON al.idUbigeo = u.idUbigeo
            WHERE al.idAlmacen = ?`, [
            req.query.idAlmacen,
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

router.post('/update', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        await conec.execute(connection, `UPDATE almacen SET 
            idUbigeo=?,
            idUsuario=?,
            nombre=?,
            direccion=?,
            tipo=?,
            estado=?
            WHERE idAlmacen=?`, [
            req.body.idUbigeo,
            req.body.idUsuario,
            req.body.nombre,
            req.body.direccion,
            parseInt(req.body.tipo),
            req.body.estado,
            req.body.idAlmacen
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos actulizados correctamente');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.delete('/delete', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        // let producto = await conec.execute(connection, `SELECT * FROM producto WHERE idAlmacen = ?`, [
        //     req.query.idAlmacen
        // ]);

        // if (producto.length > 0) {
        //     await conec.rollback(connection);
        //     res.status(400).send('No se puede eliminar el almacen ya que esta ligada con producto(s) o suministro(s).');
        //     return;
        // }

        let result = await conec.execute(connection, `SELECT sistema FROM almacen WHERE idAlmacen = ?`, [
            req.query.idAlmacen
        ]);

        if (result[0].sistema === 1) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el almacen ya que fue el primero en crearse.');
            return;
        }

        await conec.execute(connection, `DELETE FROM almacen WHERE idAlmacen = ?`, [
            req.query.idAlmacen
        ]);

        await conec.commit(connection);
        res.status(200).send('Se eliminó correctamente el almacen.');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/listcomboventa', async function (req, res) {
    try {
        let result = await conec.query(`SELECT idAlmacen, nombre, tipo FROM almacen WHERE tipo=1`)
        res.status(200).send(result)
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.get('/listcomboprodconsumo', async function (req, res) {
    try {
        let result = await conec.query(`SELECT idAlmacen, nombre, tipo FROM almacen WHERE tipo<>1`)
        res.status(200).send(result)
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.get('/listcomboall', async function (req, res) {
    try {
        let result = await conec.query(`SELECT idAlmacen, nombre, tipo FROM almacen`)
        res.status(200).send(result)
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});


module.exports = router;