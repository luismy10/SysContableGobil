const path = require('path');
const PDFDocument = require("pdfkit-table");
const getStream = require('get-stream');
const qr = require("qrcode");
const NumberLleters = require('../tools/NumberLleters');
const { formatMoney, numberFormat, calculateTaxBruto, calculateTax, dateFormat } = require('../tools/Tools');

const numberLleters = new NumberLleters();

class RepFactura {

    async repComprobante(req, sedeInfo, data) {
        const cabecera = data.cabecera;
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let orgX = doc.x;
            let orgY = doc.y;

            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            doc.image(path.join(__dirname, "..", "path/to/logo.png"), orgX, orgY, { width: 75, });

            let center = doc.page.width - doc.options.margins.left - doc.options.margins.right - 150 - 150;

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                doc.options.margins.left + 150,
                orgY + 10,
                {
                    width: center,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}\n${sedeInfo.email}`,
                doc.options.margins.left + 150,
                orgY + 27,
                {
                    width: center,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `RUC: ${sedeInfo.ruc}\n${cabecera.comprobante}\n${cabecera.serie + "-" + cabecera.numeracion}`,
                doc.page.width - 150 - doc.options.margins.right,
                orgY + 20,
                {
                    width: 150,
                    align: "center",
                }
            );

            doc.rect(
                doc.page.width - 150 - doc.options.margins.right,
                orgY,
                150,
                70).stroke();

            doc.fontSize(h2).fill('#777').text(
                "INFORMACIÓN",
                doc.options.margins.top,
                doc.y + 20
            );

            doc.fill("#000000");

            let topCebecera = doc.y + 5;

            doc.fontSize(h3).text(
                `Tipo de documento: ${cabecera.tipoDoc} \nN° de documento: ${cabecera.documento} \nNombre/Razón Social: ${cabecera.informacion}\nDirección: ${cabecera.direccion}`,
                doc.options.margins.left,
                topCebecera
            );

            doc.fontSize(h3).text(
                `Fecha: ${cabecera.fecha} \nMoneda: ${cabecera.moneda + " - " + cabecera.codiso} \nForma de Venta: ${cabecera.tipo == 1 ? "CONTADO" : "CRÉDITO"}`,
                medioX,
                topCebecera
            );

            doc.x = doc.options.margins.left;

            let detalle = data.detalle.map((item, index) => {
                return [++index, "ZZ", item.cantidad, item.lote, numberFormat(item.precio, cabecera.codiso), numberFormat((item.precio * item.cantidad), cabecera.codiso)];
            });


            const table = {
                subtitle: "DETALLE",
                headers: ["Ítem", "Unidad de medida", "Cantidad", "Descripción", "Valor Unitario", "Precio de Venta"],
                rows: detalle,
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 90, 80, 152, 90, 90],
                x: doc.x,
                y: doc.y + 20,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.x = 0;

            let subTotal = 0;
            let impuestoTotal = 0;
            let total = 0;
            let impuestos = [];

            for (let item of data.detalle) {
                let cantidad = item.cantidad;
                let valor = item.precio;

                let impuesto = item.porcentaje;

                let valorActual = cantidad * valor;
                let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                let valorNeto = valorSubNeto + valorImpuesto;

                impuestos.push({ "idImpuesto": item.idImpuesto, "nombre": item.impuesto, "valor": valorImpuesto });

                subTotal += valorSubNeto;
                impuestoTotal += valorImpuesto;
                total += valorNeto;
            }

            let arrayImpuestos = [];
            for (let item of impuestos) {
                if (this.duplicateImpuestos(impuestos, item)) {
                    arrayImpuestos.push(item)
                } else {
                    for (let newItem of arrayImpuestos) {
                        if (newItem.idImpuesto === item.idImpuesto) {
                            let currenteObject = newItem;
                            currenteObject.valor += parseFloat(item.valor);
                            break;
                        }
                    }
                }
            }

            let ypost = doc.y + 5;
            doc.fontSize(h3);

            let text = "IMPORTE BRUTO:";
            let widthtext = doc.widthOfString(text);

            let subtext = numberFormat(subTotal, cabecera.codiso);
            let widthsubtext = doc.widthOfString(subtext);

            doc.text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                stroke: true,
                align: "right",
            });

            // 
            ypost = doc.y + 5;

            text = "DESCUENTO:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(0, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                stroke: true,
                align: "right",
            });

            // 
            ypost = doc.y + 5;

            text = "SUB IMPORTE:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(subTotal, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                stroke: true,
                align: "right",
            });

            // 

            for (let item of arrayImpuestos) {
                ypost = doc.y + 5;

                text = item.nombre;
                widthtext = doc.widthOfString(text);

                subtext = numberFormat(item.valor, cabecera.codiso);
                widthsubtext = doc.widthOfString(subtext);

                doc.text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    stroke: true,
                    align: "right",
                });
            }

            // 
            ypost = doc.y + 5;

            text = "IMPORTE NETO:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(total, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                stroke: true,
                align: "right",
            });

            doc.fontSize(h3).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left,
                doc.y + 5);

            let qrResult = await this.qrGenerate(`|
            ${sedeInfo.ruc}|
            ${cabecera.codigoVenta}|
            ${cabecera.serie}|
            ${cabecera.numeracion}|
            ${impuestoTotal}|
            ${total}|
            ${cabecera.fecha}|
            ${cabecera.codigoCliente}|
            ${cabecera.documento}|`);

            doc.image(qrResult, doc.options.margins.left, doc.y, { width: 100, });

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repCobro(req, sedeInfo, data) {
        const cabecera = data.cabecera;
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let orgX = doc.x;
            let orgY = doc.y;

            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            doc.image(path.join(__dirname, "..", "path/to/logo.png"), orgX, orgY, { width: 75, });

            let center = doc.page.width - doc.options.margins.left - doc.options.margins.right - 150 - 150;

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                doc.options.margins.left + 150,
                orgY + 10,
                {
                    width: center,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}\n${sedeInfo.email}`,
                doc.options.margins.left + 150,
                orgY + 27,
                {
                    width: center,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `RUC: ${sedeInfo.ruc}\n${cabecera.comprobante}\n${cabecera.serie + "-" + cabecera.numeracion}`,
                doc.page.width - 150 - doc.options.margins.right,
                orgY + 20,
                {
                    width: 150,
                    align: "center",
                }
            );

            doc.rect(
                doc.page.width - 150 - doc.options.margins.right,
                orgY,
                150,
                70).stroke();

            doc.fontSize(h2).fill('#777').text(
                "INFORMACIÓN",
                doc.options.margins.top,
                doc.y + 20
            );

            doc.fill("#000000");

            let topCebecera = doc.y + 5;

            doc.fontSize(h3).text(
                `Tipo de documento: ${cabecera.tipoDoc} \nN° de documento: ${cabecera.documento} \nNombre/Razón Social: ${cabecera.informacion}\nDirección: ${cabecera.direccion}`,
                doc.options.margins.left,
                topCebecera
            );

            doc.fontSize(h3).text(
                `Fecha: ${cabecera.fecha} \nMoneda: ${cabecera.moneda + " - " + cabecera.codiso}`,
                medioX,
                topCebecera
            );

            doc.x = doc.options.margins.left;


            let detalle = data.detalle.length > 0 ?
                data.detalle.map((item, index) => {
                    return [++index, item.concepto, item.cantidad, item.impuesto, numberFormat(item.precio, cabecera.codiso), numberFormat((item.precio * item.cantidad), cabecera.codiso)];
                })
                :
                data.venta.map((item, index) => {
                    return [++index, item.comprobante, numberFormat(item.total, cabecera.codiso), numberFormat(item.cobrado, cabecera.codiso), numberFormat(item.total - item.cobrado, cabecera.codiso), numberFormat(item.precio, cabecera.codiso)];
                });

            const table = {
                subtitle: "DETALLE",
                headers: data.detalle.length > 0 ? ["Ítem", "Concepto", "Cantidad", "Impuesto", "Valor", "Monto"] : ["Ítem", "Concepto", "Total", "Cobrado", "Por Cobrar", "Monto"],
                rows: detalle,
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 152, 80, 90, 90, 90],
                x: doc.x,
                y: doc.y + 30,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.x = 0;

            let subTotal = 0;
            let impuestoTotal = 0;
            let total = 0;
            let impuestos = [];
            let arrayImpuestos = [];

            if (data.detalle.length > 0) {
                for (let item of data.detalle) {
                    let cantidad = item.cantidad;
                    let valor = item.precio;

                    let impuesto = item.porcentaje;

                    let valorActual = cantidad * valor;
                    let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                    let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                    let valorNeto = valorSubNeto + valorImpuesto;

                    impuestos.push({ "idImpuesto": item.idImpuesto, "nombre": item.impuesto, "valor": valorImpuesto });

                    subTotal += valorSubNeto;
                    impuestoTotal += valorImpuesto;
                    total += valorNeto;
                }


                for (let item of impuestos) {
                    if (this.duplicateImpuestos(impuestos, item)) {
                        arrayImpuestos.push(item)
                    } else {
                        for (let newItem of arrayImpuestos) {
                            if (newItem.idImpuesto === item.idImpuesto) {
                                let currenteObject = newItem;
                                currenteObject.valor += parseFloat(item.valor);
                                break;
                            }
                        }
                    }
                }
            } else {
                for (let item of data.venta) {
                    total += item.cobrado;
                }
            }

            // 
            if (data.detalle.length > 0) {
                let ypost = doc.y + 5;

                let text = "SUB IMPORTE:";
                let widthtext = doc.widthOfString(text);

                let subtext = numberFormat(subTotal, cabecera.codiso);
                let widthsubtext = doc.widthOfString(subtext);

                doc.text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    stroke: true,
                    align: "right",
                });

                // 

                for (let item of arrayImpuestos) {
                    ypost = doc.y + 5;

                    text = item.nombre;
                    widthtext = doc.widthOfString(text);

                    subtext = numberFormat(item.valor, cabecera.codiso);
                    widthsubtext = doc.widthOfString(subtext);

                    doc.text(text,
                        doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                        ypost, {
                        width: widthtext + 10,
                        align: "right",
                    });

                    doc.text(subtext,
                        doc.page.width - doc.options.margins.right - widthsubtext,
                        ypost, {
                        width: widthsubtext,
                        stroke: true,
                        align: "right",
                    });
                }

                // 
                ypost = doc.y + 5;

                text = "IMPORTE NETO:";
                widthtext = doc.widthOfString(text);

                subtext = numberFormat(total, cabecera.codiso);
                widthsubtext = doc.widthOfString(subtext);

                doc.text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    stroke: true,
                    align: "right",
                });
            } else {
                let ypost = doc.y + 5;

                let text = "IMPORTE TOTAL:";
                let widthtext = doc.widthOfString(text);

                let subtext = numberFormat(total, cabecera.codiso);
                let widthsubtext = doc.widthOfString(subtext);

                doc.text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    stroke: true,
                    align: "right",
                });
            }

            doc.fontSize(h3).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left,
                doc.y + 5);

            // let qrResult = await this.qrGenerate(`|
            // ${sedeInfo.ruc}|
            // ${cabecera.codigoVenta}|
            // ${cabecera.serie}|
            // ${cabecera.numeracion}|
            // ${impuestoTotal}|
            // ${total}|
            // ${cabecera.fecha}|
            // ${cabecera.codigoCliente}|
            // ${cabecera.documento}|`);

            // doc.image(qrResult, doc.options.margins.left, doc.y, { width: 100, });

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            console.log(error);
            return "Se genero un error al generar el reporte.";
        }
    }

    async repGasto(req, sedeInfo, data) {
        const cabecera = data.cabecera;
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let orgX = doc.x;
            let orgY = doc.y;

            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            doc.image(path.join(__dirname, "..", "path/to/logo.png"), orgX, orgY, { width: 75, });

            let center = doc.page.width - doc.options.margins.left - doc.options.margins.right - 150 - 150;

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                doc.options.margins.left + 150,
                orgY + 10,
                {
                    width: center,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}\n${sedeInfo.email}`,
                doc.options.margins.left + 150,
                orgY + 27,
                {
                    width: center,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `RUC: ${sedeInfo.ruc}\n${cabecera.comprobante}\n${cabecera.serie + "-" + cabecera.numeracion}`,
                doc.page.width - 150 - doc.options.margins.right,
                orgY + 20,
                {
                    width: 150,
                    align: "center",
                }
            );

            doc.rect(
                doc.page.width - 150 - doc.options.margins.right,
                orgY,
                150,
                70).stroke();

            doc.fontSize(h2).fill('#777').text(
                "INFORMACIÓN",
                doc.options.margins.top,
                doc.y + 20
            );

            doc.fill("#000000");

            let topCebecera = doc.y + 5;

            doc.fontSize(h3).text(
                `Tipo de documento: ${cabecera.tipoDoc} \nN° de documento: ${cabecera.documento} \nNombre/Razón Social: ${cabecera.informacion}\nDirección: ${cabecera.direccion}`,
                doc.options.margins.left,
                topCebecera
            );

            doc.fontSize(h3).text(
                `Fecha: ${cabecera.fecha} \nMoneda: ${cabecera.moneda + " - " + cabecera.codiso}`,
                medioX,
                topCebecera
            );

            doc.x = doc.options.margins.left;

            let detalle = data.detalle.map((item, index) => {
                return [++index, item.concepto, item.cantidad, item.impuesto, numberFormat(item.precio, cabecera.codiso), numberFormat((item.precio * item.cantidad), cabecera.codiso)];
            })

            const table = {
                subtitle: "DETALLE",
                headers: ["Ítem", "Concepto", "Cantidad", "Impuesto", "Valor", "Monto"],
                rows: detalle,
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 152, 80, 90, 90, 90],
                x: doc.x,
                y: doc.y + 30,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.x = 0;

            let subTotal = 0;
            let impuestoTotal = 0;
            let total = 0;
            let impuestos = [];
            let arrayImpuestos = [];

            for (let item of data.detalle) {
                let cantidad = item.cantidad;
                let valor = item.precio;

                let impuesto = item.porcentaje;

                let valorActual = cantidad * valor;
                let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                let valorNeto = valorSubNeto + valorImpuesto;

                impuestos.push({ "idImpuesto": item.idImpuesto, "nombre": item.impuesto, "valor": valorImpuesto });

                subTotal += valorSubNeto;
                impuestoTotal += valorImpuesto;
                total += valorNeto;
            }


            for (let item of impuestos) {
                if (this.duplicateImpuestos(impuestos, item)) {
                    arrayImpuestos.push(item)
                } else {
                    for (let newItem of arrayImpuestos) {
                        if (newItem.idImpuesto === item.idImpuesto) {
                            let currenteObject = newItem;
                            currenteObject.valor += parseFloat(item.valor);
                            break;
                        }
                    }
                }
            }

            let ypost = doc.y + 5;

            let text = "SUB IMPORTE:";
            let widthtext = doc.widthOfString(text);

            let subtext = numberFormat(subTotal, cabecera.codiso);
            let widthsubtext = doc.widthOfString(subtext);

            doc.text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                stroke: true,
                align: "right",
            });

            // 

            for (let item of arrayImpuestos) {
                ypost = doc.y + 5;

                text = item.nombre;
                widthtext = doc.widthOfString(text);

                subtext = numberFormat(item.valor, cabecera.codiso);
                widthsubtext = doc.widthOfString(subtext);

                doc.text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    stroke: true,
                    align: "right",
                });
            }

            // 
            ypost = doc.y + 5;

            text = "IMPORTE NETO:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(total, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                stroke: true,
                align: "right",
            });

            doc.fontSize(h3).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left,
                doc.y + 5);

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    duplicateImpuestos(array, impuesto) {
        let value = false
        for (let item of array) {
            if (item.idImpuesto === impuesto.idImpuesto) {
                value = true
                break;
            }
        }
        return value
    }

    qrGenerate(data) {
        return new Promise((resolve, reject) => {
            qr.toDataURL(data, (err, src) => {
                if (err) reject("Error occured");

                resolve(src);
            });
        })
    }

    async repVentas(req, sedeInfo, data) {
        try {
            const doc = new PDFDocument({
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `REPORTE DE VENTAS DEL ${req.query.fechaIni} AL ${req.query.fechaFin}`

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let filtroY = cabeceraY + 40;
            let bodY = filtroY + 65;
            let titleX = orgX + 150;
            let medioX = (doc.page.width - doc.options.margins.left - doc.options.margins.right) / 2;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;


            doc.image(path.join(__dirname, "..", "path/to/logo.png"), doc.x, doc.y, { width: 75 });

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                "REPORTE GENERAL DE VENTAS",
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h3).text(
                `PERIODO: ${dateFormat(req.query.fechaIni)} al ${dateFormat(req.query.fechaFin)}`,
                orgX,
                cabeceraY + 26,
                {
                    width: 300,
                    align: "left",
                }
            );

            doc.rect(
                orgX,
                filtroY,
                doc.page.width - doc.options.margins.left - doc.options.margins.right,
                50).stroke();

            doc.fontSize(h3).text(
                `Comprobante(s): ${req.query.idComprobante === '' ? "TODOS" : req.query.comprobante}`,
                orgX + 5,
                filtroY + 6
            );
            doc.fontSize(h3).text(
                `Cliente(s): ${req.query.idCliente === '' ? "TODOS" : req.query.cliente}`,
                orgX + 5,
                filtroY + 20
            );
            doc.fontSize(h3).text(
                `Vendedor(s): ${req.query.idUsuario === '' ? "TODOS" : req.query.usuario}`,
                orgX + 5,
                filtroY + 34
            );

            doc.fontSize(h3).text(
                `Tipo(s): ${req.query.tipoVenta === 0 ? "TODOS" : req.query.tipo}`,
                medioX + 15,
                filtroY + 6
            );

            let contadoCount = 0;
            let creditoCount = 0;

            let content = data.map((item, index) => {
                creditoCount += item.tipo === "CRÉDITO" && item.estado !== "ANULADO" ? item.total : 0;
                contadoCount += item.tipo === "CONTADO" && item.estado !== "ANULADO" ? item.total : 0;
                return [
                    item.fecha,
                    item.documento + "\n" + item.informacion,
                    item.comprobante + "\n" + item.serie + "-" + item.numeracion,
                    item.tipo,
                    item.estado,
                    numberFormat(item.total, item.codiso)]
            });

            const table = {
                subtitle: "DETALLE",
                headers: ["Fecha", "Cliente", "Comprobante", "Tipo", "Estado", "Importe"],
                rows: content.length == 0 ? [["No hay datos para mostrar"]] : content
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [60, 102, 100, 90, 90, 90],
                x: orgX,
                y: bodY,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            let ypost = doc.y + 5;
            doc.fontSize(h3);

            let nameContado = "TOTAL AL CONTADO:";
            let nameCredito = "TOTAL AL CRÉDITO:";
            let widthNameContado = doc.widthOfString(nameContado);
            let widthNameCredito = doc.widthOfString(nameCredito);

            let totalContado = numberFormat(contadoCount);
            let totalCredito = numberFormat(creditoCount);

            let widthTotalContado = doc.widthOfString(totalContado);
            let widthTotalCredito = doc.widthOfString(totalCredito);

            doc.text(nameContado,
                doc.page.width - doc.options.margins.right - widthNameContado - widthTotalContado - 20,
                ypost, {
                width: widthNameContado + 10,
                align: "right",
            });

            doc.text(totalContado,
                doc.page.width - doc.options.margins.right - widthTotalContado,
                ypost, {
                width: widthTotalContado,
                stroke: "black",
                align: "right",
            });

            ypost = doc.y + 5;

            doc.text(nameCredito,
                doc.page.width - doc.options.margins.right - widthNameCredito - widthTotalCredito - 20,
                ypost, {
                width: widthNameCredito + 10,
                align: "right"
            });

            doc.text(totalCredito,
                doc.page.width - doc.options.margins.right - widthTotalCredito,
                ypost, {
                width: widthTotalCredito,
                stroke: "black",
                align: "right",
            });

            doc.end();

            return getStream.buffer(doc);
        } catch (error) {
            console.log(error);
            return "Se genero un error al generar el reporte.";
        }
    }


}

module.exports = RepFactura;