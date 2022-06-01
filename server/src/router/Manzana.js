const express = require('express');
const router = express.Router();
const Manzana = require('../services/Manzana');

const manzana = new Manzana();

router.get("/list", async function (req, res) {
    const result = await manzana.list(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/id', async function (req, res) {
    const result = await manzana.id(req);
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
})

router.post("/", async function (req, res) {
    const result = await manzana.add(req);
    if (result === 'insert') {
        res.status(200).send("Se registró correctamente la manzana.");
    } else {
        res.status(500).send(result);
    }
});

router.put("/", async function (req, res) {
    const result = await manzana.edit(req);
    if (result === 'update') {
        res.status(200).send("Se actualizó correctamente la manzana.");
    } else {
        res.status(500).send(result);
    }
});

router.delete('/', async function (req, res) {
    const result = await manzana.delete(req);
    if (result === 'delete') {
        res.status(200).send("Se eliminó correctamente la manzana.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/listcombo', async function (req, res) {
    const result = await manzana.listcombo(req);
    if (Array.isArray(result)) {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});


module.exports = router;