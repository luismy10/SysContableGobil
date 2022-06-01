const express = require('express');
const router = express.Router();
const Conexion = require('../database/Conexion');
const conec = new Conexion()

router.get('/lista', async function (req, res) {
    try {

        let lista = await conec.query(`SELECT
            idPlan, codigo, nombre, descripcion, tipo, mutable, estado, idRelacion
            FROM planCuenta`)

        let arr = []

        for (let item of lista) {
            arr.push({
                ...item,
            })

            for (let i of arr) {

                console.log(i.idPlan)
                console.log(item.idRelacion)
                console.log('------')

                if (i.idPlan === item.idRelacion) {
                    console.log('56')
                }
            }
        }

        return res.status(200).send(lista)

    } catch (error) {
        console.log(error)
    }
})

module.exports = router;