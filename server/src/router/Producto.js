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

router.post('/add', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let existe = await conec.execute(connection, `SELECT nombre FROM producto`)

        for (let item of existe) {
            if (item.nombre === req.body.nombre) {
                await conec.rollback(connection)
                res.status(400).send('Ya existe un producto con el mismo nombre')
                return;
            }
        }

        let result = await conec.execute(connection, 'SELECT idProducto FROM producto');
        let idProducto = "";

        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idProducto.replace("PD", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'PD000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'PD00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'PD0' + incremental;
            } else {
                codigoGenerado = 'PD' + incremental;
            }

            idProducto = codigoGenerado;
        } else {
            idProducto = "PD0001";
        }

        await conec.execute(connection, `INSERT INTO producto(
            idProducto,
            idAlmacen,
            idImpuesto,
            idMedida,
            destino,
            tipo,
            codigo,
            nombre,
            costo,
            estado,
            categoria,
            marca,
            descripcion) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            idProducto,
            req.body.idAlmacen,
            req.body.idImpuesto,
            req.body.idMedida,
            req.body.destino,
            req.body.tipo,
            req.body.codigo,
            req.body.nombre,
            req.body.costo,
            req.body.estado,
            req.body.categoria,
            req.body.marca,
            req.body.descripcion
        ]);

        await conec.execute(connection, `INSERT INTO cantidad(
            idAlmacen,
            idProducto ,
            stockMinimo,
            stockMaximo,
            cantidad) values (?,?,?,?,?)`, [
            req.body.idAlmacen,
            idProducto,
            0,
            0,
            0
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente');

    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection)
        }
        res.status(500).send('Error interno de conexión, intente nuevamente.')
    }
});

router.get('/id', async function (req, res) {

    try {
        
        let result = await conec.query( `SELECT 
        prod.idProducto,
        prod.idAlmacen,
        prod.idImpuesto,
        prod.idMedida,
        med.nombre as medida,
        prod.destino,
        prod.tipo,
        prod.codigo,
        prod.nombre,
        prod.costo,
        prod.estado,
        prod.categoria,
        prod.marca,
        prod.descripcion
        FROM producto AS prod
        INNER JOIN medida AS med ON prod.idMedida=med.idMedida
        WHERE idProducto=?`, [
            req.query.idProducto
        ]);

        if (result.length > 0) {
            res.status(200).send(result[0]);
        } else {
            res.status(400).send("Datos no encontrados");
        }

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
        console.log(error)
    }
});

router.post('/update', async function (req, res){
    let connection = null;
    try{

        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, `SELECT idAlmacen FROM producto WHERE idProducto=?`, [
            req.body.idProducto
        ]);

        if(result[0].idAlmacen !== req.body.idAlmacen){
            await conec.execute(connection, `UPDATE cantidad
                SET
                idAlmacen=?
                WHERE idProducto=?`, [
                req.body.idAlmacen,
                req.body.idProducto
            ]);
        }

        await conec.execute(connection, `UPDATE producto 
            SET 
            idAlmacen=?,
            idImpuesto=?,
            idMedida=?,
            destino=?,
            tipo=?,
            codigo=?,
            nombre=?,
            costo=?,
            estado=?,
            categoria=?,
            marca=?,
            descripcion=?
            WHERE idProducto=?`, [
            req.body.idAlmacen,
            req.body.idImpuesto,
            req.body.idMedida,
            req.body.destino,
            req.body.tipo,
            req.body.codigo,
            req.body.nombre,
            req.body.costo,
            req.body.estado,
            req.body.categoria,
            req.body.marca,
            req.body.descripcion,

            req.body.idProducto
        ])

        await conec.commit(connection)
        res.status(200).send('Datos actualizados correctamente.')

    } catch(error){
        if (connection != null) {
            await conec.rollback(connection)
        }
        res.status(500).send('Error interno de conexión, intente nuevamente.')
        console.log(error)
    }
});

router.delete('/delete', async function(req, res){
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let ventaDetalle = await conec.execute(connection, `SELECT * FROM ventaDetalle WHERE idProducto=?`, [
            req.query.idProducto
        ]);

        if (ventaDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el producto ya que esta ligada a un detalle de venta.')
            return;
        }

        await conec.execute(connection, `DELETE FROM producto WHERE idProducto=?`, [
            req.query.idProducto
        ]);

        await conec.execute(connection, `DELETE FROM cantidad WHERE idProducto=?`, [
            req.query.idProducto
        ]);

        await conec.commit(connection)
        res.status(200).send('Se eliminó correctamente el producto.')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});


//Unidad de medida
router.get('/listmedida', async function (req, res) {
    try {
        let result = await conec.query(`SELECT
            idMedida, nombre, descripcion, codigo, estado  
            FROM medida
            WHERE
            ? = 0
            OR 
            ? = 1 AND nombre like concat(?,'%')`, [
            req.query.opcion,
            req.query.opcion,
            req.query.buscar
        ]);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.post('/addmedida', async function (req, res) {

    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let existe = await conec.execute(connection, 'SELECT nombre FROM medida');

        for (let item of existe) {
            if (item.nombre === req.body.nombre) {
                await conec.rollback(connection);
                res.status(400).send('Ya existe una medida con el mismo nombre');
                return;
            }
        }

        let result = await conec.execute(connection, 'SELECT idMedida FROM medida');
        let idMedida = "";

        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idMedida.replace("MD", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'MD000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'MD00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'MD0' + incremental;
            } else {
                codigoGenerado = 'MD' + incremental;
            }

            idMedida = codigoGenerado;
        } else {
            idMedida = "MD0001";
        }

        await conec.execute(connection, `INSERT INTO medida(
            idMedida, nombre, descripcion, codigo, estado) values (?,?,?,?,?)`, [
            idMedida,
            req.body.nombre,
            '',
            req.body.codigo,
            1
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

router.post('/updatemedida', async function (req, res) {

    let connection = null;
    try {
        connection = await conec.beginTransaction();

        await conec.execute(connection, `UPDATE medida SET 
            nombre=?, codigo=? WHERE idMedida=?`, [
            req.body.nombre,
            req.body.codigo,
            req.body.idMedida,
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos actulizados correctamente');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
})

router.get('/listfiltermedida', async function (req, res) {
    try {
        let result = await conec.query(`SELECT 
            idMedida,
            nombre,
            codigo
            FROM medida 
            WHERE 
            nombre LIKE CONCAT(?,'%')`, [
            req.query.filtrar
        ])
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});


//Producto por almacen
router.get('/listprodalmacen', async function (req, res) {
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
        ? = 0 AND al.idAlmacen=?
        OR
        ? = 1 AND prod.nombre LIKE CONCAT(?,'%') AND al.idAlmacen=?
        LIMIT ?,?`, [
            parseInt(req.query.opcion),
            req.query.idAlmacen,

            parseInt(req.query.opcion),
            req.query.buscar,
            req.query.idAlmacen,

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
            ? = 0 AND al.idAlmacen=?
            OR
            ? = 1 AND prod.nombre LIKE CONCAT(?,'%') AND al.idAlmacen=?`, [
            parseInt(req.query.opcion),
            req.query.idAlmacen,

            parseInt(req.query.opcion),
            req.query.buscar,
            req.query.idAlmacen
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total })

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

module.exports = router;