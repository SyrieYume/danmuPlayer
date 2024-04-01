const video = document.querySelector('video')
const title = document.querySelector('#title')
const danmuCanvas = document.querySelector('#danmuCanvas')
const urlInput = document.querySelector('#video-url');
const videoOffset = document.querySelector('#video-offset');
const confirmUrlButton = document.querySelector('#confirm-video-url');
const fileInput = document.getElementById('file-input');
const danmuSwitch = document.getElementById("danmu-switch");
const videoContainer = document.getElementById("videoContainer");
const configEditor = document.getElementById("configEditor");
const highlightContent = document.getElementById("highlighting-content");


confirmUrlButton.onclick = function() {
    const url = urlInput.value.trim().replace(/^"(.*)"$/,"$1");
    if(url.endsWith("m3u8")){
        var hls = new Hls();
        hls.attachMedia(video);
        hls.loadSource(url);
    }
    else video.src = url;
};

const DanmuConfig = {
    speed: 5,         // 弹幕速度
    size: 20,         // 弹幕文字大小
    opacity: 0.8,     // 弹幕不透明度
    area: 0.65,       // 弹幕显示区域
    shadowBlur: 6,    // 弹幕文字阴影大小
    display: true
}

const VideoConfig = {
    pause: true
}

var ctx;

function initCtx(){
    const devicePixelRatio = window.devicePixelRatio;
    danmuCanvas.width = danmuCanvas.clientWidth * devicePixelRatio;
    danmuCanvas.height = danmuCanvas.clientHeight * devicePixelRatio;
    ctx = danmuCanvas.getContext("2d");
    ctx.textAlign = "top";
    ctx.textRendering = "geometricPrecision";
    ctx.font = `bold ${DanmuConfig.size}px 黑体`;
    ctx.shadowBlur = DanmuConfig.shadowBlur;
    ctx.shadowColor = "#10101080"
}

initCtx()

var danmus = []

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = () => {
        const fileContent = reader.result;
        danmus = JSON.parse(fileContent)
        const offsetTime = Number(videoOffset.value)
        for(var i=0; i<danmus.length; i++)
            danmus[i].time += offsetTime
        title.innerHTML = file.name.split(".")[0]
    };
});

danmuSwitch.addEventListener("change", () => {
    DanmuConfig.display = danmuSwitch.checked
})

var danmuIndex = 0

var displayDanmus = []

function setDanmuIndex(){
    currentTime = Math.round(video.currentTime * 1000)
    for(var i=0; i< danmus.length; i++) {
        if(danmus[i].time >= currentTime){
            danmuIndex = i
            return
        }
    }
}

function addDanmu(data){
    var x
    var y
    
    if(data.mode <= 3) {
        x = Math.round(danmuCanvas.width + Math.random() * 40)
        y = Math.round(Math.random() * danmuCanvas.height * DanmuConfig.area/25) * 25 + 17
    }  
    else if(data.mode == 4){
        x = 400
        y = Math.round(Math.random() * 10) * 25 + 17
    }
    else if(data.mode == 5){
        x = 400
        y = Math.round(danmuCanvas.height - (Math.round(Math.random() * 10) * 25 + 17))
    }
    
    displayDanmus.push({data, x, y})

}

function moveDanmus(){
    displayDanmus.forEach((item) => {
        item.x -= DanmuConfig.speed
    })
    displayDanmus = displayDanmus.filter((item) => {return item.x > -100})
}

function updateDanmus(){
    currentTime = Math.round(video.currentTime * 1000)
    for(var i = danmuIndex; i < danmus.length; i++){
        const data = danmus[i]
        danmuIndex = i + 1
        if(data.time <= currentTime)
            addDanmu(data)
        else break
    }
}

function drawDanmus(){
    ctx.clearRect(0, 0, danmuCanvas.width, danmuCanvas.height);
    if(DanmuConfig.display)
        displayDanmus.forEach((item) => {
            const color = item.data.color + Math.floor(DanmuConfig.opacity * 255).toString(16)
            ctx.fillStyle = color;
            if(item.data.mode <= 3){
                ctx.textAlign = "left"
                ctx.fillText(item.data.content, item.x, item.y)
            }
            else{
                ctx.textAlign = "center"
                ctx.fillText(item.data.content, danmuCanvas.width / 2, item.y)
            }
        })
}

function initConfig(){
    const config = `{
    "speed": ${DanmuConfig.speed},         // 弹幕速度
    "size": ${DanmuConfig.size},         // 弹幕文字大小
    "opacity": ${DanmuConfig.opacity},     // 弹幕不透明度
    "area": ${DanmuConfig.area},       // 弹幕显示区域
    "shadowBlur": ${DanmuConfig.shadowBlur}     // 弹幕文字阴影大小
}`
    $("#configEditor")[0].innerHTML = config
    updateHighlight()
    $("#configs")[0].style.display = "block"
}

function updateHighlight(){
    highlightContent.innerHTML = configEditor.value;
    highlightContent.dataset.highlighted = "";
    hljs.highlightElement(highlightContent);
}

function setConfig(){
    var json = $("#configEditor")[0].value.replace(/\/\/.*\n/gm,"\n")
    Object.assign(DanmuConfig, JSON.parse(json))
    initCtx()
    $("#configs")[0].style.display = "none"
}

// 缩放功能
const resizeHandles = document.getElementsByClassName("resize-handle");

Array.from(resizeHandles).forEach((handle) => {handle.addEventListener("mousedown", startResize);});

function startResize(event) {
    event.preventDefault();
    const currentHandle = event.target;
    const direction = currentHandle.className.split(" ")[1];
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = videoContainer.offsetWidth;
    const startHeight = videoContainer.offsetHeight;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
    function resize(event) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        let width = startWidth,height = startHeight;
        if (direction.includes("right"))
            width = startWidth + dx + "px";
        if (direction.includes("bottom"))
            height = startHeight + dy + "px";
        if (parseInt(width) <= 0 || parseInt(height) <= 0) 
            return;
        videoContainer.style.width = width;
        videoContainer.style.height = width / videoContainer.style.aspectRatio;
        
    }
    function stopResize() {
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResize);
        initCtx()
    }
}



document.getElementById("fullscreen").onclick = () => {
    videoContainer.requestFullscreen()
}

videoContainer.addEventListener("fullscreenchange", () => {
    initCtx()
})

// 监听视频状态变化
video.addEventListener('timeupdate', () => {
    updateDanmus()
});

video.addEventListener("seeking", () => {
    displayDanmus = []
    setDanmuIndex()
});

video.addEventListener("pause", () => {
    VideoConfig.pause = true
})

video.addEventListener("play", () => {
    VideoConfig.pause = false
})


// 每隔20ms更新一次弹幕位置
setInterval(()=>{
    if(!VideoConfig.pause){
        moveDanmus()
        drawDanmus()
    }
    
},20)

