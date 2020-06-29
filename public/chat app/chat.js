
var socket=io.connect('http://localhost:3000');

var message=document.getElementById('message');
var handle=document.getElementById('handle');
var btn=document.getElementById('send');
var output=document.getElementById('output');
var feedback=document.getElementById('feedback');
btn.addEventListener('click',function(){
	
	socket.emit('chat',{
		message:message.value,
		handle:handle.value
	});
});
message.addEventListener('keypress',function(){
	socket.emit('typing',handle.value);
});
socket.on('output',function(data){
	for(x=0;x<data.length;x++){
		var message1=document.createElement('div');
		message1.setAttribute('id','output');
		message1.innerHTML+="<p><strong>"+data[x].handle+":</strong>"+data[x].message+"</p>";
		output.appendChild(message1);
		
	}
});

socket.on('chat',function(data){
	
	feedback.innerHTML="";
	output.innerHTML +='<p><strong>'+data.handle+':</strong>'+data.message+'</p>';
	message.value="";
});
socket.on('typing',function(data){
	
	feedback.innerHTML='<p><em>'+data+' is typing a message</em></p>';
});