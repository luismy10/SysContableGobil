const path = require('path');
const PDFDocument = require("pdfkit-table");
const getStream = require('get-stream');
const { formatMoney, numberFormat, dateFormat } = require('../tools/Tools');

class RepCliente {

    async repGeneral(req, sedeInfo, data) {
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

            doc.info["Title"] = "REPORTE DE APORTACIONES DE LOS CLIENTES.pdf"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 80;
            let titleX = orgX + 150;
            let medioX = doc.page.width / 2;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            doc.image(path.join(__dirname, "..", "path/to/logo.png"), orgX, orgY, { width: 75, });

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
                `${req.query.idCliente === "" ? "REPORTE DE CLIENTES" : "LISTA DE APORTACIONES"}`,
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h3).text(
                `CLIENTE: ${req.query.idCliente === "" ? "TODOS" : req.query.cliente}`,
                orgX,
                doc.y + 10,
                {
                    align: "left",
                }
            );

            doc.fontSize(h3).text(
                `PERIODO: ${dateFormat(req.query.fechaIni)} al ${dateFormat(req.query.fechaFin)}`,
                orgX,
                doc.y + 10,
                {
                    width: 300,
                    align: "left",
                }
            );


            if (req.query.idCliente !== "") {
                let content = data.map((item, index) => {
                    return [++index,
                    item.fecha + "\n" + item.hora,
                    item.comprobante + "\n" + item.serie + "-" + item.numeracion,
                    item.detalle,
                    numberFormat(item.monto)];
                });

                const table = {
                    subtitle: "DETALLE",
                    headers: ["N°", "Fecha", "Comprobante", "Detalle", "Monto"],
                    rows: content
                };

                doc.table(table, {
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                    prepareRow: () => {
                        doc.font("Helvetica").fontSize(h3);
                    },
                    padding: 5,
                    columnSpacing: 5,
                    columnsSize: [30, 90, 162, 160, 90],
                    x: doc.x,
                    y: doc.y + 15,
                    width: doc.page.width - doc.options.margins.left - doc.options.margins.right
                });
            } else {

                let array = [];
                for (let item of data) {
                    if (array.filter(f => f.idCliente === item.idCliente).length === 0) {
                        array.push({
                            "idCliente": item.idCliente,
                            "documento": item.documento,
                            "informacion": item.informacion,
                            "ingresos": item.ingresos,
                            "ventas": item.ventas,
                        });
                    } else {
                        for (let newItem of array) {
                            if (newItem.idCliente === item.idCliente) {
                                let currenteObject = newItem;
                                currenteObject.ingresos += parseFloat(item.ingresos);
                                currenteObject.ventas += parseFloat(item.ventas);
                                break;
                            }
                        }
                    }
                }

                let total = 0;
                let content = array.map((item, index) => {
                    total += item.ingresos + item.ventas;
                    return [++index, item.documento + "\n" + item.informacion, numberFormat(item.ingresos + item.ventas)];
                });

                content.push(["", "SUMA TOTAL:", numberFormat(total)]);

                const table = {
                    subtitle: "DETALLE",
                    headers: ["N°", "Cliente", "Monto"],
                    rows: content
                };

                doc.table(table, {
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                    prepareRow: () => {
                        doc.font("Helvetica").fontSize(h3);
                    },
                    padding: 5,
                    columnSpacing: 5,
                    columnsSize: [30, 412, 90],
                    x: doc.x,
                    y: doc.y + 15,
                    width: doc.page.width - doc.options.margins.left - doc.options.margins.right
                });
            }

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repDeudas(req, sedeInfo, data) {
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

            doc.info["Title"] = "LISTA DE DEUDAS"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 80;
            let titleX = orgX + 150;
            let medioX = doc.page.width / 2;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            doc.image(path.join(__dirname, "..", "path/to/logo.png"), orgX, orgY, { width: 75, });

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
                `LISTA DE DEUDAS POR CLIENTE `,
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            let content = data.map((item, index) => {
                return [++index, item.documento + "\n" + item.informacion, item.cuotasRetrasadas, item.cuotasPendientes, item.fechaPago, numberFormat(item.montoPendiente, item.codiso), numberFormat(item.montoActual, item.codiso)];
            });

            const table = {
                subtitle: "DETALLE",
                headers: ["N°", "Cliente", "Cuotas Retrasadas", "Cuotas Pendientes", "Fecha de Cobro", "Monto Retrasado", "Cuota Actual"],
                rows: content
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 100, 100, 102, 70, 65, 65],
                x: doc.x,
                y: doc.y + 15,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

}

module.exports = RepCliente;