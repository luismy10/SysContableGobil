const express = require('express');
const router = express.Router();
const Sede = require('../services/Sede')
const sede = new Sede();

router.get('/list', async function (req, res) {
    const result = await sede.listar(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.post('/add', async function (req, res) {
    const result = await sede.add(req)
    if (result === "insert") {
        res.status(200).send("Datos registrados correctamente")
    } else {
        console.log(result)
        res.status(500).send(result)
    } 
});

router.get('/id', async function (req, res) {
    const result = await sede.dataId(req)
    if (typeof result === "object") {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.post('/update', async function (req, res) {
    const result = await sede.update(req)
    if (result === "update") {
        res.status(200).send("Datos actualizados correctamente")
    } else {
        console.log(result)
        res.status(500).send(result)
    }
})

router.get('/listcombo', async function (req, res) {
    const result = await sede.listarCombo(req)
    if (Array.isArray(result)) {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

module.exports = router;
