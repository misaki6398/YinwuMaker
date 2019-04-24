var canvasSize = $('#canvas').data('canvas-size');
var fileReader = new FileReader();

var uploadedImgWidth,
    uploadedImgHeight,
    app_id = $("meta[property='fb:app_id']").attr("content");
var apidata = {};
var isPictureHeight = false,
    isPictureWidth = false;
var extendPixel = 0;
var horizontalBorderLimit = 0; //水平邊界
var verticalBorderLimit = 0; //垂直邊界
var imageScale = 1;
var canvas = new fabric.Canvas('canvas');

console.log("canvasSize:" + canvasSize);

$(document).ready(function () {


    $('.yingwuimg').click(function () {
        if (canvas !== undefined) {
            canvas.clear();
        }
        var pictureWidth = event.target.naturalWidth;
        var pictureHeight = event.target.naturalHeight;
        canvasSize = pictureHeight / 2;
        canvas.setHeight(pictureHeight);
        canvas.setWidth(pictureWidth);
        canvas.renderAll();
        canvas.setBackgroundImage(event.target.src, canvas.renderAll.bind(canvas));
        // setBound(canvas);
        var $copyablepicture = $("#copyablepicture");
        if($copyablepicture.length !== 0){         
            $copyablepicture[0].src = "";
        }
    });

    // 上傳照片============================================
    $('#uploadedImg').change(function (e) {
        var flag = checkFileSize(event.target.files);
        if (!flag) {
            alert("Please choose an image < 2MB.");
            return;
        } else {
            InitialParam();
            importPicToCanvas(e.target.files[0], canvas);
        }
    });

    // 上傳照片============================================

    $("#save").click(function () {
        var myCanvas = document.querySelector('canvas');
        var ctx = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        var baseimage = new Image();
        ctx.drawImage(baseimage, 0, 0, canvasSize, canvasSize);
        var dataURL = canvas.toDataURL("image/png");
        // document.getElementById('canvasImg').src = dataURL;
        // sendImgToServer(dataURL);
        imgDownload(dataURL);
    });


    $("#copyable").click(function() {
        var myCanvas = document.querySelector('canvas');
        var ctx = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        var baseimage = new Image();
        ctx.drawImage(baseimage, 0, 0, canvasSize, canvasSize);
        var dataURL = canvas.toDataURL("image/png");        
        var image = new Image();
        image.src = dataURL;        
        var $copyablepicture = $("#copyablepicture");
        if($copyablepicture.length === 0){
            $(".copyable-wrapper").append('<img id="copyablepicture" src="' + dataURL + '"/>');
        } else {
            $copyablepicture[0].src = dataURL;
        }
        
    });

    $("#add-text").click(function () {
        var text = $("#inputtext").val()
        var textbox = new fabric.IText(text, {
            fontFamily: '微軟正黑體',
            left: 20,
            top: 50,
            fill: '#fefefe',
            strokeWidth: 1,
            stroke: "#000000",
        });
        canvas.add(textbox);
    })

    $("#delete").click(function () {
        deleteObjects();
    });

    $(".copyable").click(function (e) {
        //Make the container Div contenteditable
        $(this).attr("contenteditable", true);
        //Select the image
        SelectText($(this).get(0));
        //Execute copy Command
        //Note: This will ONLY work directly inside a click listenner
        document.execCommand('copy');
        //Unselect the content
        window.getSelection().removeAllRanges();
        //Make the container Div uneditable again
        $(this).removeAttr("contenteditable");
        //Success!!
        alert("image copied!");
    });
});

function SelectText(element) {
    var doc = document;
    if (doc.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function setBound(canvas) {
    canvas.on({
        'object:moving': function (e) {
            e.target.opacity = 0.5;
            var obj = e.target;
            obj.setCoords();
            //top corner 
            if (obj.getBoundingRect().top < -verticalBorderLimit) {
                obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top) - verticalBorderLimit;
            }
            // left corner
            if (obj.getBoundingRect().left < -horizontalBorderLimit) {
                obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left) - horizontalBorderLimit;
            }
            //bottom corner
            if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height + verticalBorderLimit) {
                obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top) + verticalBorderLimit;
            }
            //right corner
            if (obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width + horizontalBorderLimit) {
                obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left) + horizontalBorderLimit;
            }

        },
        'object:modified': function (e) {
            e.target.opacity = 1;
        }
    });
}

function imgDownload(imgurl) {
    //使用者下載 此方法在ios無效
    var link = document.createElement("a");
    link.href = imgurl;
    link.download = "yinwu.png";
    link.click();
}

function checkFileSize(obg) {
    var filelist = obg;
    var str = "";
    var maxSize = $('#uploadedImg').data('max-size');

    for (var i = 0; i < filelist.length; i++) {
        var file = filelist[i]
        str += "name：" + escape(file.name) + "\n" + //檔名
            "type：" + file.type + "\n" + //檔案類型
            "size：" + file.size + "\n" + //檔案大小
            "lastModifiedDate：" + file.lastModifiedDate.toLocaleDateString() + "\n\n\n"; //最後修改日期
    }
    console.log(str);
    if (file.size >= maxSize) {
        return false;
    } else {
        return true;
    }

}

function importPicToCanvas(target, canvas) {
    // var obj = canvas.getObjects()[0];
    // if (typeof obj !== "undefined") {
    //     obj.remove();
    // }

    fileReader.onload = function (event) {
        var imgObj = new Image();
        imgObj.src = event.target.result;
        imgObj.onload = function () {
            var image = new fabric.Image(imgObj);
            // 判斷傳進來的圖片是 直圖/橫圖/正方形圖
            if (image.width > image.height) {
                imageScale = canvasSize / image.height;
                isPictureWidth = true;
                extendPixel = Math.round((image.width * imageScale) - canvasSize);
                horizontalBorderLimit = extendPixel;
            } else if (image.width < image.height) {
                imageScale = canvasSize / image.width;
                isPictureHeight = true;
                extendPixel = Math.round((image.height * imageScale) - canvasSize);
                verticalBorderLimit = extendPixel;
            } else {
                //image.width==image.height
                imageScale = canvasSize / image.height;
            }
            console.log(image.height + "/" + image.width);
            console.log(imageScale);
            console.log(extendPixel);
            image.set({
                left: 0,
                top: 0,
                scaleX: imageScale,
                scaleY: imageScale,
                hasControls: true,
                hasBorders: true
            });
            uploadedImgHeight = image.height;
            uploadedImgwidth = image.width;
            canvas.centerObject(image);
            canvas.add(image);
            canvas.renderAll();
        }
    }
    fileReader.readAsDataURL(target);
}



function InitialParam() {
    isPictureHeight = false, isPictureWidth = false;
    extendPixel = 0;
    horizontalBorderLimit = 0; //水平邊界
    verticalBorderLimit = 0; //垂直邊界
    imageScale = 1;
}

function deleteObjects() {
    var activeObject = canvas.getActiveObject(),
        activeGroup = canvas.getActiveGroup();
    if (activeObject) {
        canvas.remove(activeObject);

    } else if (activeGroup) {

        var objectsInGroup = activeGroup.getObjects();
        canvas.discardActiveGroup();
        objectsInGroup.forEach(function (object) {
            canvas.remove(object);
        });

    }
}