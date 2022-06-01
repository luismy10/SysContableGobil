import bootstrap from "../../recursos/js/bootstrap";
import Swal from "../../recursos/js/sweetalert";

export function statePrivilegio(value) {
  if (value === undefined) return false;
  return value === 1 ? true : false;
}

export function formatMoney(
  amount,
  decimalCount = 2,
  decimal = ".",
  thousands = ""
) {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(
      (amount = Math.abs(Number(amount) || 0).toFixed(decimalCount))
    ).toString();
    let j = i.length > 3 ? i.length % 3 : 0;

    return (
      negativeSign +
      (j ? i.substr(0, j) + thousands : "") +
      i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
      (decimalCount
        ? decimal +
          Math.abs(amount - i)
            .toFixed(decimalCount)
            .slice(2)
        : "")
    );
  } catch (e) {
    return 0;
  }
}

export const numberFormat = (value, currency = "PEN") => {
  let formats = [
    {
      locales: "es-PE",
      options: {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2,
      },
    },
    {
      locales: "en-US",
      options: {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      },
    },
    {
      locales: "de-DE",
      options: {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      },
    },
  ];

  let newFormat = formats.filter((item) => currency === item.options.currency);
  if (newFormat.length > 0) {
    var formatter = new Intl.NumberFormat(newFormat[0].locales, {
      style: newFormat[0].options.style,
      currency: newFormat[0].options.currency,
    });
    return formatter.format(value);
  } else {
    return 0;
  }
};

export function currentDate() {
  let date = new Date();
  let formatted_date =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1 > 9
      ? date.getMonth() + 1
      : "0" + (date.getMonth() + 1)) +
    "-" +
    (date.getDate() > 9 ? date.getDate() : "0" + date.getDate());
  return formatted_date;
}

export function currentTime() {
  let time = new Date();
  let formatted_time =
    (time.getHours() > 9 ? time.getHours() : "0" + time.getHours()) +
    ":" +
    (time.getMinutes() > 9 ? time.getMinutes() : "0" + time.getMinutes()) +
    ":" +
    (time.getSeconds() > 9 ? time.getSeconds() : "0" + time.getSeconds());
  return formatted_time;
}

export function validateDate(date) {
  var regex = new RegExp(
    "([0-9]{4}[-](0[1-9]|1[0-2])[-]([0-2]{1}[0-9]{1}|3[0-1]{1})|([0-2]{1}[0-9]{1}|3[0-1]{1})[-](0[1-9]|1[0-2])[-][0-9]{4})"
  );
  return regex.test(date);
}

export function validateComboBox(comboBox) {
  if (comboBox.children("option").length === 0) {
    return true;
  }
  if (comboBox.children("option").length > 0 && comboBox.val() === "") {
    return true;
  } else {
    return false;
  }
}

export function validateEmail(value) {
  var validRegex =
    /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (value.match(validRegex)) {
    return true;
  } else {
    return false;
  }
}

export function isNumeric(value) {
  try {
    if (value.trim().length === 0 || value === "undefined") return false;

    if (isNaN(value.trim())) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function isText(value) {
  try {
    if (
      value.trim() === "" ||
      value.trim().length === 0 ||
      value === "undefined" ||
      value === null
    ) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function keyNumberInteger(event) {
  var key = window.Event ? event.which : event.keyCode;
  var c = String.fromCharCode(key);
  if ((c < "0" || c > "9") && c !== "\b") {
    event.preventDefault();
  }
}

export function keyNumberFloat(event) {
  var key = window.Event ? event.which : event.keyCode;
  var c = String.fromCharCode(key);
  if ((c < "0" || c > "9") && c !== "\b" && c !== ".") {
    event.preventDefault();
  }
  if (c === "." && event.target.value.includes(".")) {
    event.preventDefault();
  }
}

export function keyNumberPhone(event) {
  var key = window.Event ? event.which : event.keyCode;
  var c = String.fromCharCode(key);
  if ((c < "0" || c > "9") && c !== "\b" && c !== "." && c !== "+") {
    event.preventDefault();
  }
  if (c === "." && event.target.value.includes(".")) {
    event.preventDefault();
  }
  if (c === "+" && event.target.value.includes("+")) {
    event.preventDefault();
  }
}

export function dateFormat(value) {
  var parts = value.split("-");
  let today = new Date(parts[0], parts[1] - 1, parts[2]);
  return (
    (today.getDate() > 9 ? today.getDate() : "0" + today.getDate()) +
    "/" +
    (today.getMonth() + 1 > 9
      ? today.getMonth() + 1
      : "0" + (today.getMonth() + 1)) +
    "/" +
    today.getFullYear()
  );
}

export function timeForma24(value) {
  var hourEnd = value.indexOf(":");
  var H = +value.substr(0, hourEnd);
  var h = H % 12 || 12;
  var ampm = H < 12 || H === 24 ? "AM" : "PM";
  return h + value.substr(hourEnd, 3) + ":" + value.substr(6, 2) + " " + ampm;
}

export function getExtension(filename) {
  return filename.split("?")[0].split("#")[0].split(".").pop();
}

export function convertNullText(value) {
  let text = value === undefined ? null : value;
  return text === null ? "" : text;
}

export function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export function calculateTaxBruto(impuesto, monto) {
  return monto / ((impuesto + 100) * 0.01);
}

export function calculateTax(porcentaje, valor) {
  let igv = parseFloat(porcentaje) / 100.0;
  return valor * igv;
}

export function showModal(id) {
  let myModal = new bootstrap.Modal(document.getElementById(id));
  myModal.show();
}

export function hideModal(id) {
  const myModal = bootstrap.Modal.getInstance(document.getElementById(id));
  myModal.hide();
}

export function viewModal(id, callback = function () {}) {
  let myModalEl = document.getElementById(id);
  myModalEl.addEventListener("shown.bs.modal", callback);
}

export function clearModal(id, callback = function () {}) {
  let myModalEl = document.getElementById(id);
  myModalEl.addEventListener("hidden.bs.modal", callback);
}

export function spinnerLoading(message = "Cargando datos..") {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center h-100">
      <div>
        <div className="spinner-grow text-danger" role="status"></div>
        <div className="spinner-grow text-warning" role="status"></div>
        <div className="spinner-grow text-info" role="status"></div>
      </div>
      <div>
        <strong>{message}</strong>
      </div>
    </div>
  );
}

export function readDataURL(files) {
  return new Promise((resolve, reject) => {
    let file = files[0];
    let blob = file.slice();
    var reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function imageSizeData(data) {
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.src = data;
    image.onload = function () {
      var height = this.height;
      var width = this.width;
      resolve({ width, height });
    };
    image.onerror = reject;
  });
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export function ModalAlertClear() {
  Swal({
    type: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    clearModal: true,
  });
}

export function ModalAlertInfo(title, message) {
  Swal({
    title: title,
    text: message,
    type: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
}

export function ModalAlertSuccess(title, message, callback = function () {}) {
  Swal({
    title: title,
    text: message,
    type: "success",
    showConfirmButton: true,
    allowOutsideClick: false,
  }).then((event) => {
    callback();
  });
}

export function ModalAlertWarning(title, message, callback = function () {}) {
  Swal({
    title: title,
    text: message,
    type: "warning",
    showConfirmButton: true,
    allowOutsideClick: false,
  }).then((event) => {
    callback();
  });
}

export function ModalAlertError(title, message) {
  Swal({
    title: title,
    text: message,
    type: "error",
    showConfirmButton: true,
    allowOutsideClick: false,
  });
}

export function ModalAlertDialog(title, mensaje, callback) {
  Swal({
    title: title,
    text: mensaje,
    type: "question",
    showCancelButton: true,
    confirmButtonText: "Si",
    cancelButtonText: "No",
    allowOutsideClick: false,
  }).then((isConfirm) => {
    if (isConfirm.value === undefined) {
      return false;
    }
    if (isConfirm.value) {
      callback(true);
    } else {
      callback(false);
    }
  });
}
