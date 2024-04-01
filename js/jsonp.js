function jsonpGet(url){
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
    setTimeout(()=>{
        document.body.removeChild(script)
    },5000)
}

function jsonpCallback(data){
    console.log(data)
}