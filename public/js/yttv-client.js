var socket = io.connect();
$(function() {

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
	}

	function playing(id) {
		$('#videos li').removeClass('active');
		$('#' + id).addClass('active');
	}

	function remove(id) {
		$('#' + id).remove();
	}

	var source = $("#list-item-template").html();
	var template = Handlebars.compile(source);

	function addVideoToList(data) {
		var index = data.index;
		var item = template(data.video);
		$('#videos').insertIndex(item, index);
	}

	$(function () {
		buttons();
		sockets();
	});

});