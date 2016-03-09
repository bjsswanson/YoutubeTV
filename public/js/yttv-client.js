var socket = io.connect();
$(function() {
	var playingSource = $("#list-item-template").html();
	var playingTemplate = Handlebars.compile(playingSource);

	var iPlayerSource = $("#iPlayer-queue-template").html();
	var iPlayerTemplate = Handlebars.compile(iPlayerSource);

	iPlayerQueueEmpty(function(){ $('.iPlayer').slideUp(); });

	function progress() {
		var button = $('#uploadButton');
		var uploadProgress = $('#uploadProgress');
		uploadProgress.removeClass("progress-bar-success");

		var xhr = new window.XMLHttpRequest();
		xhr.upload.addEventListener("progress", function(evt) {
			if (evt.lengthComputable) {

				var percentComplete = evt.loaded / evt.total;
				percentComplete = parseInt(percentComplete * 100);

				uploadProgress.text(percentComplete + "%");
				uploadProgress.css("width", percentComplete + "%");

				if (percentComplete === 100) {
					uploadProgress.addClass("progress-bar-success");
					button.prop('disabled', false);
					button.text('Upload');
				}

			}
		}, false);

		return xhr;
	}

	function events(){
		$(document).on('change', '.btn-file :file', function() {
			var input = $(this);
			var numFiles = input.get(0).files ? input.get(0).files.length : 1;
			var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		$(document).ready( function() {
			$('.btn-file :file').on('fileselect', function(event, numFiles, label) {
				var input = $(this).parents('.input-group').find(':text');
				var log = numFiles > 1 ? numFiles + ' files selected' : label;
				if( input.length ) {
					input.val(log);
				} else {
					if( log ) alert(log);
				}
			});
		});

		$(document).on('click', '#uploadButton', function() {
			var button = $('#uploadButton');
			if(!button.prop('disabled'))  {
				button.prop('disabled', true);
				button.text('Uploading...')

				var input = $('#uploadFile');
				var fd = new FormData();

				$.each(input[0].files, function(file) {
					fd.append("file" + file, this);
				})

				$.ajax({
					xhr: progress,
					url: '/upload',
					data: fd,
					processData: false,
					contentType: false,
					type: 'POST'
				});
			}
		});

		$(document).on('click', '#videos .play', function(e) {
			var li = $(e.currentTarget).closest('li');
			var id = li.attr('id');
			socket.emit('play', id)
		})

		$(document).on('click', '#videos .remove', function(e) {
			var li = $(e.currentTarget).closest('li');
			var id = li.attr('id');
			socket.emit('removeVideo', id)
		})

		$(document).on('click', '#playCurrent', function(e) {
			socket.emit('playCurrent')
		})

		$(document).on('click', '#stopCurrent', function(e) {
			socket.emit('stopCurrent')
		})

		$.fn.insertIndex = function (item, i) {
			if (i === 0) {
				this.prepend(item);
			} else {
				var $target = this.children().eq(i - 1);
				if ($target.length > 0) {
					$target.after(item);
				} else {
					this.append(item);
				}
			}

			return this;
		};
	}

	function buttons() {
		$('.addNextYoutube').click(function (e) {
				e.preventDefault();
				var input = $('#youtubeLink');
				var link = input.val();
				socket.emit("addNext", link);
				input.val("");
			}
		);

		$('.addLastYoutube').click(function (e) {
				e.preventDefault();
				var input = $('#youtubeLink');
				var link = input.val();
				socket.emit("addLast", link);
				input.val("");
			}
		);

		$('.addNextLocal').click(function (e) {
				e.preventDefault();
				var path = $(e.toElement).closest("[data-local-path]").data("local-path");
				socket.emit("addNext", path);
			}
		);

		$('.addLastLocal').click(function (e) {
				e.preventDefault();
				var path = $(e.toElement).closest("[data-local-path]").data("local-path");
				socket.emit("addLast", path);
			}
		);

		$('.deleteLocal').click(function (e) {
				e.preventDefault();
				var path = $(e.toElement).closest("[data-local-path]").data("local-path");
				var name = $(e.toElement).closest("[data-local-name]").data("local-name");
				bootbox.confirm("Are you sure you want to delete: " + name + "?", function (result) {
					if (result) {
						socket.emit("deleteLocal", path);
					}
				});
			}
		);

		$('#removeAllConfirmed').click(function(e){
			$('#confirmRemoveAll').modal('hide');
			socket.emit("removeAll");
		});
	}

	function sockets() {
		socket.on('addedVideo', function (data) {
			addVideoToList(data);
		});

		socket.on('addedVideoAndPlaying', function (data) {
			addVideoToList(data);
			playing(data.video.id)
		});

		socket.on('playing', function (id) {
			playing(id)
		});

		socket.on('removingVideo', function (id) {
			remove(id);
		});

		socket.on('stop', function(){
			$('#videos li').removeClass('active');
		})

		socket.on('removingAll', function () {
			$('#videos li').remove();
		})

		socket.on('deleteLocal', function (id) {
			$('.localFile').filter(function(){
				return $(this).data('local-path') === id
			}).remove();
		})

		socket.on('iPlayerQueue', function(data){
			iPlayerQueueEmpty(function(){ $('.iPlayer').slideDown(); })

			var item = iPlayerTemplate(data);
			$('.iPlayerQueue').append(item);
		})

		socket.on('iPlayerProgress', function(data){
			var progress = $(".iPlayerDownload[data-id='" + data.video.id + "'] > .iPlayerProgress");
			progress.text(data.progress);
		})

		socket.on('iPlayerDone', function(data){
			$(".iPlayerDownload[data-id='" + data.video.id + "']").remove();
			iPlayerQueueEmpty(function(){ $('.iPlayer').slideUp(); })
		})
	}

	function iPlayerQueueEmpty(callback){
		var length = $('.iPlayerQueue > tr').length;
		if(length == 0){
			callback();
		}
	}

	function playing(id) {
		$('#videos li').removeClass('active');
		$('#' + id).addClass('active');
	}

	function remove(id) {
		$('#' + id).remove();
	}

	function addVideoToList(data) {
		var index = data.index;
		var item = playingTemplate(data.video);
		$('#videos').insertIndex(item, index);
	}

	$(function () {
		events();
		buttons();
		sockets();
	});

});