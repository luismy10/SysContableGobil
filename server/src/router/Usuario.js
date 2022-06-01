const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');

const conec = new Conexion()

router.get('/list', async function (req, res) {
    try {

        let lista = await conec.query(`SELECT 
        u.idUsuario,
        u.dni,
        u.nombres,
        u.apellidos,
        u.telefono,
        u.email,
        u.representante,
        IFNULL(p.descripcion,'-') AS perfil,
        u.estado
        FROM usuario AS u 
        LEFT JOIN perfil AS p ON u.idPerfil  = p.idPerfil
        WHERE 
        ? = 0
        OR
        ? = 1 and u.nombres like concat(?,'%')
        OR
        ? = 1 and u.apellidos like concat(?,'%')
        OR
        ? = 1 and u.dni like concat(?,'%')
        LIMIT ?,?`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.opcion),
            req.query.buscar,

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
        FROM usuario AS u LEFT JOIN perfil AS p ON u.idPerfil  = p.idPerfil
        WHERE 
        ? = 0
        OR
        ? = 1 and u.nombres like concat(?,'%')
        OR
        ? = 1 and u.apellidos like concat(?,'%')
        OR
        ? = 1 and u.dni like concat(?,'%')`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.opcion),
            req.query.buscar,
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total });
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.post('/', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idUsuario FROM usuario');
        let idUsuario = "";
        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idUsuario.replace("US", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'US000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'US00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'US0' + incremental;
            } else {
                codigoGenerado = 'US' + incremental;
            }

            idUsuario = codigoGenerado;
        } else {
            idUsuario = "US0001";
        }

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(req.body.clave, salt);

        let usuario = await conec.execute(connection, `SELECT * FROM usuario
        WHERE usuario = ?`, [
            req.body.usuario,
        ]);

        if (usuario.length > 0) {
            await conec.rollback(connection);
            res.status(400).send("Hay un usuario con el mismo valor.");
            return;
        }

        await conec.execute(connection, `INSERT INTO usuario(
            idUsuario, 
            nombres, 
            apellidos, 
            dni, 
            genero, 
            direccion, 
            telefono, 
            email,
            idPerfil, 
            representante, 
            estado, 
            usuario, 
            clave,
            fecha,
            hora,
            fupdate,
            hupdate ) 
            VALUES(?, ?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?)`, [
            idUsuario,
            req.body.nombres,
            req.body.apellidos,
            req.body.dni,
            req.body.genero,
            req.body.direccion,
            req.body.telefono,
            req.body.email,
            req.body.idPerfil,
            req.body.representante,
            req.body.estado,
            req.body.usuario,
            hash,
            currentDate(),
            currentTime(),
            currentDate(),
            currentTime(),
        ])

        await conec.commit(connection);
        res.status(200).send('Los datos se registrarón correctamente.')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.put('/', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let usuario = await conec.execute(connection, `SELECT * FROM usuario
        WHERE usuario = ? AND idUsuario <> ?`, [
            req.body.usuario,
            req.body.idUsuario
        ]);

        if (usuario.length > 0) {
            await conec.rollback(connection);
            res.status(400).send("Hay un usuario con el mismo valor.");
            return;
        }

        await conec.execute(connection, `UPDATE usuario SET 
            nombres=?, 
            apellidos=?, 
            dni=?, 
            genero=?, 
            direccion=?, 
            telefono=?, 
            email=?, 
            idPerfil=?, 
            representante=?, 
            estado=?, 
            usuario=?,
            fupdate=?,
            hupdate=?
            WHERE idUsuario=?`, [
            req.body.nombres,
            req.body.apellidos,
            req.body.dni,
            req.body.genero,
            req.body.direccion,
            req.body.telefono,
            req.body.email,
            req.body.idPerfil,
            req.body.representante,
            req.body.estado,
            req.body.usuario,
            currentDate(),
            currentTime(),
            req.body.idUsuario
        ])

        await conec.commit(connection)
        res.status(200).send('Los datos se actualizarón correctamente.')
    } catch (error) {
        console.log(error)
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.delete('/', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let venta = await conec.execute(connection, `SELECT * FROM venta WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (venta.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligada a una venta.')
            return;
        }

        let sede = await conec.execute(connection, `SELECT * FROM sede WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (sede.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligada a una sede.')
            return;
        }

        let proyecto = await conec.execute(connection, `SELECT * FROM proyecto WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (proyecto.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un proyecto.')
            return;
        }

        let perfil = await conec.execute(connection, `SELECT * FROM perfil WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (perfil.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligada a un perfil.')
            return;
        }

        let moneda = await conec.execute(connection, `SELECT * FROM moneda WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (moneda.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligada a una moneda.')
            return;
        }

        let manzana = await conec.execute(connection, `SELECT * FROM manzana WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (manzana.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligada a una manzana.')
            return;
        }

        let lote = await conec.execute(connection, `SELECT * FROM lote WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (lote.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un lote.')
            return;
        }

        let impuesto = await conec.execute(connection, `SELECT * FROM impuesto WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (impuesto.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un impuesto.')
            return;
        }

        let gasto = await conec.execute(connection, `SELECT * FROM gasto WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (gasto.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un gasto.')
            return;
        }

        let concepto = await conec.execute(connection, `SELECT * FROM concepto WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (concepto.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un concepto.')
            return;
        }

        let comprobante = await conec.execute(connection, `SELECT * FROM comprobante WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (comprobante.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un comprobante.')
            return;
        }

        let cobro = await conec.execute(connection, `SELECT * FROM cobro WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (cobro.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un cobro.')
            return;
        }

        let cliente = await conec.execute(connection, `SELECT * FROM cliente WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (cliente.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un cliente.')
            return;
        }

        let bancoDetalle = await conec.execute(connection, `SELECT * FROM bancoDetalle WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (bancoDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un bancoDetalle.')
            return;
        }

        let banco = await conec.execute(connection, `SELECT * FROM banco WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        if (banco.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el usuario ya que esta ligado a un banco.')
            return;
        }

        await conec.execute(connection, `DELETE FROM usuario WHERE idUsuario = ?`, [
            req.query.idUsuario
        ]);

        await conec.commit(connection);
        res.status(200).send('Se eliminó correctamente el usuario.');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.post('/reset', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(req.body.clave, salt);

        await conec.execute(connection, `UPDATE usuario SET
        clave = ?
        WHERE idUsuario=?`, [
            hash,
            req.body.idUsuario
        ]);

        await conec.commit(connection)
        res.status(200).send('Se actualizó la contraseña correctamente.')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.get('/id', async function (req, res) {
    try {
        let result = await conec.query('SELECT * FROM usuario WHERE idUsuario  = ?', [
            req.query.idUsuario
        ]);

        if (result.length > 0) {
            res.status(200).send(result[0]);
        } else {
            res.status(400).send("Datos no encontrados");
        }

    } catch (error) {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.get('/listcombo', async function (req, res) {
    try {
        let result = await conec.query(`SELECT 
            idUsuario, nombres, apellidos, dni, estado
            FROM usuario`);
        res.status(200).send(result);

    } catch (error) {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
})


module.exports = router;