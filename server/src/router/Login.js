const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { createToken, verifyToken, token } = require('../services/Jwt');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

router.get('/createsession', async function (req, res) {
    try {
        let validate = await conec.query(`SELECT idUsuario ,clave FROM usuario 
        WHERE usuario = ?`, [
            req.query.usuario,
        ]);

        if (validate.length > 0) {

            let hash = bcrypt.compareSync(req.query.password, validate[0].clave);

            if (hash) {

                let usuario = await conec.query(`SELECT 
                idUsuario, 
                nombres,
                apellidos,
                idPerfil,
                estado
                FROM usuario
                WHERE idUsuario = ?`, [
                    validate[0].idUsuario
                ]);

                if (usuario[0].estado === 0) {
                    res.status(400).send("Su cuenta se encuentra inactiva.")
                    return;
                }

                let user = {
                    idUsuario: usuario[0].idUsuario,
                    nombres: usuario[0].nombres,
                    apellidos: usuario[0].apellidos,
                    estado: usuario[0].estado
                }

                let menu = await conec.query(`
                SELECT 
                m.idMenu,
                m.nombre,
                m.ruta,
                pm.estado,
                m.icon 
                FROM permisoMenu as pm 
                INNER JOIN perfil as p on pm.idPerfil = p.idPerfil
                INNER JOIN menu as m on pm.idMenu = m.idMenu
                WHERE p.idPerfil = ?
                `, [
                    usuario[0].idPerfil,
                ]);

                let submenu = await conec.query(`
                SELECT 
                sm.idMenu,
                sm.idSubMenu,
                sm.nombre,
                sm.ruta,
                psm.estado
                FROM permisoSubMenu as psm
                INNER JOIN perfil AS p ON psm.idPerfil = p.idPerfil
                INNER JOIN subMenu AS sm on sm.idMenu = psm.idMenu and sm.idSubMenu = psm.idSubMenu
                WHERE psm.idPerfil = ?
                `, [
                    usuario[0].idPerfil,
                ]);

                let privilegio = await conec.query(`SELECT
                pp.idPrivilegio,
                pp.idSubMenu,
                pp.idMenu,
                pv.nombre,
                pp.estado
                FROM permisoPrivilegio AS pp
                INNER JOIN perfil AS p ON p.idPerfil = pp.idPerfil
                INNER JOIN privilegio AS pv ON pv.idPrivilegio = pp.idPrivilegio AND pv.idSubMenu = pp.idSubMenu AND pv.idMenu = pp.idMenu
                WHERE pp.idPerfil = ?`, [
                    usuario[0].idPerfil,
                ]);

                const token = await createToken(user, 'userkeylogin');

                res.status(200).send({ ...user, token, menu, submenu, privilegio })
            } else {
                res.status(400).send("Datos incorrectos, intente nuevamente.")
            }
        } else {
            res.status(400).send("Datos incorrectos, intente nuevamente.")
        }
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.get('/validtoken', token, async function (req, res) {
    try {

        await verifyToken(req.token, 'userkeylogin');

        res.status(200).send("Ok");
    } catch (error) {
        if (error == "expired") {
            res.status(403).send("Sesión expirada")
        } else {
            res.status(500).send("Error del servidor, intente nuevamente.")
        }
    }
});

// router.post("/list", verifyToken, async (req, res) => {
//     try {
//         let result = await new Promise((resolve, reject) => {
//             jwt.verify(req.token, 'secretkey', (error, authorization) => {
//                 if (error) {
//                     reject("expired");
//                 } else {
//                     resolve(authorization);
//                 }
//             });
//         });

//         res.status(200).send({ "data": { "ok": "data list" }, "authorization": result });

//     } catch (error) {
//         if (error == "expired") {
//             res.status(403).send("Sesión expirada")
//         } else {
//             res.status(500).send("Error del servidor, intente nuevamente.")
//         }
//     }
// });


module.exports = router;