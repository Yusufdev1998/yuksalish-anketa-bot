const fs = require("fs")

module.exports = (base64, callback) => {
    let extension = ""
    let readyBase64 = ""
    if (base64.indexOf("png") > -1) {
        extension = "png"
        readyBase64 = base64.replace(/^data:image\/png;base64,/, "")
    }


    if (base64.indexOf("jpeg") > -1) {
        extension = "jpg"
        readyBase64 = base64.replace(/^data:image\/jpeg;base64,/, "")
    }
    const path = "image." + extension
    fs.writeFile(path, readyBase64, "base64", (err) => {
        console.log(err);
        callback(path)
        
    })
}