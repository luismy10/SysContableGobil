const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion()

router.get('/list', async function (req, res) {
    try {
        let lista = await conec.query(`SELECT 
            idConcepto,
            nombre,
            tipo,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            hora 
            FROM concepto
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

        let total = await conec.query(`SELECT COUNT(*) AS Total FROM concepto
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
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.post('/add', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idConcepto FROM concepto');
        let idConcepto = "";
        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idConcepto.replace("CP", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'CP000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'CP00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'CP0' + incremental;
            } else {
                codigoGenerado = 'CP' + incremental;
            }

            idConcepto = codigoGenerado;
        } else {
            idConcepto = "CP0001";
        }

        await conec.execute(connection, `INSERT INTO concepto(
            idConcepto, 
            nombre, 
            tipo,
            codigo,
            fecha, 
            hora,
            fupdate,
            hupdate,
            idUsuario) 
            VALUES(?,?,?,?,?,?,?,?,?)`, [
            idConcepto,
            req.body.nombre,
            req.body.tipo,
            req.body.codigo,
            currentDate(),
            currentTime(),
            currentDate(),
            currentTime(),
            req.body.idUsuario
        ])

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente')
    } catch (error) {
        console.log(error)
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error de servidor");
    }
});

router.get('/id', async function (req, res) {
    try {
        let result = await conec.query('SELECT * FROM concepto WHERE idConcepto  = ?', [
            req.query.idConcepto
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

        await conec.execute(connection, `UPDATE concepto SET 
        nombre=?, 
        tipo=?,
        codigo=?,
        fupdate=?,
        hupdate=?,
        idUsuario=?
        WHERE idConcepto=?`, [
            req.body.nombre,
            req.body.tipo,
            req.body.codigo,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
            req.body.idConcepto,
        ])

        await conec.commit(connection)
        res.status(200).send('Los datos se actualizarón correctamente.')
    } catch (error) {
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

        let cobroDetalle = await conec.execute(connection, `SELECT * FROM cobroDetalle WHERE idConcepto = ?`, [
            req.query.idConcepto
        ]);

        if (cobroDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el concepto ya que esta ligada a un detalle de cobro.')
            return;
        }

        let gastoDetalle = await conec.execute(connection, `SELECT * FROM gastoDetalle WHERE idConcepto = ?`, [
            req.query.idConcepto
        ]);

        if (gastoDetalle.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el concepto ya que esta ligada a un detalle de gasto.')
            return;
        }

        let lote = await conec.execute(connection, `SELECT * FROM lote WHERE idConcepto = ?`, [
            req.query.idConcepto
        ]);

        if (lote.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar el concepto ya que esta ligada a un lote.')
            return;
        }

        await conec.execute(connection, `DELETE FROM concepto WHERE idConcepto = ?`, [
            req.query.idConcepto
        ]);

        await conec.commit(connection)
        res.status(200).send('Se eliminó correctamente el concepto..')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.get('/listcombo', async function (req, res) {
    try {
        let result = await conec.query('SELECT idConcepto, nombre FROM concepto WHERE tipo = 2');
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/listcombogasto', async function (req, res) {
    try {
        let result = await conec.query('SELECT idConcepto, nombre FROM concepto WHERE tipo = 1');
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});


// CUENTAS

router.get('/listcuentas', async function (req, res) {
    try {

        let lista = await conec.query(`SELECT 
            idConcepto,
            codigo,
            nombre,
            tipo,
            nivel,
            sistema,
            estado,
            descripcion,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            hora,
            idRelacion,
            DATE_FORMAT(fupdate,'%d/%m/%Y') as fupdate,
            hupdate,
            idUsuario
            FROM concepto`);

        res.status(200).send(lista)

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.get('/idcuenta', async function (req, res) {
    try {
        let result = await conec.query('SELECT * FROM concepto WHERE idConcepto  = ?', [
            req.query.idConcepto
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

router.post('/addcuenta', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idConcepto FROM concepto');
        let idConcepto = "";
        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idConcepto.replace("CP", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'CP000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'CP00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'CP0' + incremental;
            } else {
                codigoGenerado = 'CP' + incremental;
            }

            idConcepto = codigoGenerado;
        } else {
            idConcepto = "CP0001";
        }

        await conec.execute(connection, `INSERT INTO concepto(
            idConcepto,
            codigo,
            nombre,
            tipo,
            nivel,
            sistema,
            estado,
            descripcion,
            fecha,
            hora,
            idRelacion,
            fupdate,
            hupdate,
            idUsuario)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            idConcepto,
            req.body.codigo,
            req.body.nombre,
            req.body.tipo,
            req.body.nivel,
            req.body.sistema,
            req.body.estado,
            req.body.descripcion,
            currentDate(),
            currentTime(),
            req.body.idRelacion,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
        ])

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error de servidor");

        console.log(error)
    }
});

router.post('/updatecuenta', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        await conec.execute(connection, `UPDATE concepto SET 
            codigo=?,
            nombre=?,
            sistema=?,
            descripcion=?,
            fupdate=?,
            hupdate=?,
            idUsuario=?
            WHERE idConcepto=?`, [
            req.body.codigo,
            req.body.nombre,
            req.body.sistema,
            req.body.descripcion,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
            req.body.idConcepto
        ])

        await conec.commit(connection)
        res.status(200).send('Los datos se actualizarón correctamente.')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.delete('/deletecuenta', async function (req, res) {
    let connection = null;
    try {

        connection = await conec.beginTransaction();

        let hijo = await conec.execute(connection, `SELECT * FROM concepto WHERE idRelacion = ?`, [
            req.query.idConcepto
        ]);

        if (hijo.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('Para borrar la cuenta contable tiene que eliminar o mover primero sus categorías.')
            return;
        }

        await conec.execute(connection, `DELETE FROM concepto WHERE idConcepto = ?`, [
            req.query.idConcepto
        ]);

        await conec.commit(connection)
        res.status(200).send('Se eliminó correctamente el concepto..')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
})


// ESTADO DE RESULTADOS

// utilidad bruta
router.get('/listautilidadbruta', async function (req, res) {
    try {

        let utilidadBruta = await conec.query(`SELECT 
            idConcepto,
            codigo,
            nombre,
            tipo,
            nivel,
            sistema,
            estado,
            descripcion,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            hora,
            idRelacion,
            DATE_FORMAT(fupdate,'%d/%m/%Y') as fupdate,
            hupdate,
            idUsuario
            FROM concepto WHERE tipo=4 OR tipo=5`);

        res.status(200).send(utilidadBruta)
    } catch (error) {
        {
            res.status(500).send("Error interno de conexión, intente nuevamente.")
        }
    }
})

// utilidad operacional
router.get('/listautilidadoperacional', async function (req, res) {
    try {

        let utilidadOperacional = await conec.query(`SELECT 
            idConcepto,
            codigo,
            nombre,
            tipo,
            nivel,
            sistema,
            estado,
            descripcion,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            hora,
            idRelacion,
            DATE_FORMAT(fupdate,'%d/%m/%Y') as fupdate,
            hupdate,
            idUsuario
            FROM concepto WHERE tipo=4 OR tipo=5`);

        res.status(200).send(utilidadOperacional)
    } catch (error) {
        {
            res.status(500).send("Error interno de conexión, intente nuevamente.")
        }
    }
})

// utilidad antes de impuestos
router.get('/listautilidadantesipm', async function (req, res) {
    try {

        let utilidadAntesImp = await conec.query(`SELECT 
            idConcepto,
            codigo,
            nombre,
            tipo,
            nivel,
            sistema,
            estado,
            descripcion,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            hora,
            idRelacion,
            DATE_FORMAT(fupdate,'%d/%m/%Y') as fupdate,
            hupdate,
            idUsuario
            FROM concepto WHERE tipo=5`);

        res.status(200).send(utilidadAntesImp)
    } catch (error) {
        {
            res.status(500).send("Error interno de conexión, intente nuevamente.")
        }
    }
})


// ESTADO DE SITUACIÓN FINANCIERA

// lista activos
router.get('/listactivos', async function (req, res) {
    try {
        let listActivos = await conec.query(`SELECT 
        c.idConcepto,
        c.codigo,
        c.nombre,
        c.tipo,
        c.nivel,
        c.sistema,
        c.estado,
        c.descripcion,
        c.idRelacion,
        IFNULL(SUM(+ad.debito-ad.credito),0) AS monto
        FROM concepto AS c
        LEFT JOIN asientoDetalle AS ad ON c.idConcepto = ad.idConcepto
    
        WHERE c.tipo=1
        GROUP by c.idConcepto`);

        res.status(200).send(listActivos)
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})

// lista pasivos
router.get('/listapasivos', async function (req, res) {
    try {
        let listaPasivos = await conec.query(`SELECT 
        c.idConcepto,
        c.codigo,
        c.nombre,
        c.tipo,
        c.nivel,
        c.sistema,
        c.estado,
        c.descripcion,
        c.idRelacion,
        IFNULL(SUM(-ad.debito+ad.credito),0) AS monto
        FROM concepto AS c
        LEFT JOIN asientoDetalle AS ad ON c.idConcepto = ad.idConcepto
        WHERE c.tipo=2
        GROUP by c.idConcepto`);

        res.status(200).send(listaPasivos)
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})

// lista patrimonio
router.get('/listapatrimonio', async function (req, res) {
    try {

        let listaPatrimonio = await conec.query(`SELECT 
        c.idConcepto,
        c.codigo,
        c.nombre,
        c.tipo,
        c.nivel,
        c.sistema,
        c.estado,
        c.descripcion,
        c.idRelacion,
        IFNULL(SUM(-ad.debito+ad.credito),0) AS monto
        FROM concepto AS c
        LEFT JOIN asientoDetalle AS ad ON c.idConcepto = ad.idConcepto
        WHERE tipo=3
        GROUP by c.idConcepto`);

        res.status(200).send(listaPatrimonio)
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})

// suma ingresos
router.get('/sumaingresos', async function (req, res) {
    try {

        let sumaIngresos = await conec.query(`SELECT 
        IFNULL(SUM(-ad.debito+ad.credito),0) AS monto
        FROM concepto AS c
        INNER JOIN asientoDetalle AS ad ON c.idConcepto = ad.idConcepto
        WHERE c.tipo = 4`);

        res.status(200).send(sumaIngresos[0])
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})

// suma gastos
router.get('/sumagastos', async function (req, res) {
    try {

        let sumaGastos = await conec.query(`SELECT 
        IFNULL(SUM(+ad.debito-ad.credito),0) AS monto
        FROM concepto AS c
        INNER JOIN asientoDetalle AS ad ON c.idConcepto = ad.idConcepto
        WHERE c.tipo = 5`);

        res.status(200).send(sumaGastos[0])
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})


// PARA IMPUESTOS

// ventas y compras
router.get('/listaimpcontables', async function (req, res) {
    try {

        let impVentas = await conec.query(`SELECT 
        idConcepto, codigo, nombre, tipo, nivel, sistema, estado, idRelacion
        FROM concepto WHERE idConcepto='CP0065' OR idRelacion='CP0065'`)

        let impCompras = await conec.query(`SELECT 
        idConcepto, codigo, nombre, tipo, nivel, sistema, estado, idRelacion
        FROM concepto WHERE idConcepto='CP0042' OR idRelacion='CP0042'`)

        return res.status(200).send({ "impVentas": impVentas, "impCompras": impCompras })

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})


// PARA ASIENTOS

// search bar concepto
router.get('/listacomboconceptos', async function (req, res) {
    try {

        let lista = await conec.query(`SELECT 
            idConcepto, codigo, nombre AS nombreConcepto, tipo, nivel, sistema, estado, idRelacion
            FROM concepto
            WHERE 
            codigo LIKE CONCAT(?,'%')
            OR
            nombre LIKE CONCAT(?,'%')`, [
            req.query.filtrar,
            req.query.filtrar
        ]);

        return res.status(200).send(lista)

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
})


module.exports = router;
