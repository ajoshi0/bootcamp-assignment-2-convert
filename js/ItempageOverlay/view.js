/* Product cart object. */
var cart =
{
	items: { },
	item_data: { },

	init: function()
	{
		var now = parseInt (new Date().getTime(),10);

		if (localStorage.expires)
		{
			if (now > localStorage.expires)
			{
				this.clear();
			}
		}

		localStorage.expires = now + 2*24*3600;

		this.item_data = { };

		if (localStorage.items)
			this.items = JSON.parse(localStorage.items);
		else
			this.items = {};
	},

	clear: function () {
		localStorage.total = 0;
		localStorage.items = null;
	},

	getTotal: function () {
		if (localStorage.total) return parseInt(localStorage.total,10);
		return 0;
	},

	setTotal: function (n) {
		return (localStorage.total = n);
	},

	getItem: function (id)
	{
		if (this.items[id])
			return parseInt(this.items[id],10);
		else
			return 0;
	},

	setItem: function (id, count)
	{
		this.items[id] = count;
		localStorage.items = JSON.stringify(this.items);
	}
};

/* View for a single product. */
var ProductDetailsView = Backbone.View.extend ({

	tagName: "div",

	template: null,

	templates: { },
	qty: -1,

	events: {
		"click .review_close": "hide",
		"click .review_close2": "hide",
		"click .review_layer": "hideWithCheck",
		"click .dropdown-menu.filter a": "_changeValueAndRefresh",
		"click .qty .dropdown-menu a": "_changeQty",
		"click .add-to-cart": "_addToCart"
	},

	_changeValueAndRefresh: function(evt)
	{
		var t = $(evt.target);

		t.parents(".btn-group:first").find(".value").text(t.text()).data("value", t.data("value"));
		this.refreshComments();
	},

	_changeQty: function(evt)
	{
		var t = $(evt.target);
		t.parents(".qty:first").data("value", t.text()).find(".value").text(t.text());

		this.qty = parseInt(t.text(),10);
	},

	_addToCart: function(evt)
	{
		if (this.qty == -1) this.qty = 1;

		$(".cart-items:visible").text (cart.setTotal (cart.getTotal() + this.qty)).parents(".willblink:first").addClass("blink");
		setTimeout(function() { $(".cart-items:visible").parents(".willblink:first").removeClass("blink"); }, 1500);

		cart.setItem (this.data.genericContent.itemId, cart.getItem(this.data.genericContent.itemId) + this.qty);

		this.$(".qty .value").text("Qty");
		this.qty = -1;

		return false;
	},

	initialize: function()
	{
		var self = this;

		$.ajax ({ type: "get", async: false, url: "res/data/"+this.model.id+".json", dataType: "json", success: function(result) { self.data = result; } });

		this.data.model = this.model.toJSON();
		this.data.ratings = window.ratings;

		this.data.images = this.data.alternateImageData;
		if (!this.data.images || !this.data.images.length) this.data.images = [{ lgImageSrc: this.data.productImageUrl }];

		this.data.related = [
			$.extend({ cls: "a first" }, window.itemdataset[parseInt(Math.random()*itemdataset.length,10)]),
			$.extend({ cls: "b" }, window.itemdataset[parseInt(Math.random()*itemdataset.length,10)]),
			$.extend({ cls: "c last" }, window.itemdataset[parseInt(Math.random()*itemdataset.length,10)])
		];

		// Format specifications.
		var attributes = this.data.itemAttributes;
		var groups = { };

		for (i = 0; i < attributes.length; i++)
		{
			var attr = attributes[i];
			var groupName = attr.groupName;

			if (!groups[groupName])
				groups[groupName] = { order:attr.groupDisplayOrder, items:[] };

			groups[groupName].items.push({ order:attr.attributeDisplayOrder, value:attr.attributeValue, name:attr.attrDisplayName,  });
		}

		// Specification groups.
		this.data.groups = _.toArray(groups).sort(function(a,b){return a.order-b.order});

		for (var i = 0 ; i < this.data.groups.length; i++)
			this.data.groups[i].items.sort(function(a,b){return a.order-b.order});

		// Populate filters.
		this.populateFilters();

		// Load templates.
		this.templates = {
			"top-carousel": _.loadTemplate("ItempageOverlay/top-carousel"),
			"details": _.loadTemplate("ItempageOverlay/details"),
			"header": _.loadTemplate("ItempageOverlay/header"),
			"related": _.loadTemplate("ItempageOverlay/related"),
			"review-comments": _.loadTemplate("ItempageOverlay/review-comments"),
			"review-details": _.loadTemplate("ItempageOverlay/review-details"),
			"comments": Handlebars.compile(_.loadTemplate("ItempageOverlay/comments"))
		};

		this.layer = Handlebars.compile((Handlebars.compile(_.loadTemplate("ItempageOverlay/layer"))) (this.templates));
	},

	populateFilters: function()
	{
		var genders = _.extractUnique(this.data.ratings, "gender");
		var ages = _.extractUnique(this.data.ratings, "age");
		var ratings = _.extractUnique(this.data.ratings, "rating");
		var filter;

		// Gender filter.
		this.data.filterGenders = filter = [];

		if (genders.indexOf("male") != -1 && genders.indexOf("female") != -1)
			filter.push({ value: 3, title: "Male & Female" });

		if (genders.indexOf("male") != -1)
			filter.push({ value: 2, title: "Male" });

		if (genders.indexOf("female") != -1)
			filter.push({ value: 1, title: "Female" });

		// Age filter.
		this.data.filterAges = filter = [];

		filter.push({ value: "All", title: "All Ages" });
		ages.sort();

		for (var i = 0; i < ages.length; i++)
		{
			var j = ages[i].split("-");

			if (j.length < 2) {
				j[0] = _.getInt(j[0]);
				j[1] = 100;
			} else {
				j[0] = _.getInt(j[0]);
				j[1] = _.getInt(j[1]);
			}

			filter.push({ value: ages[i], title: j[0]+"-"+j[1] });
		}

		// Rating filter.
		this.data.filterRatings = filter = [];

		filter.push({ value: "0,5", title: "All Ratings" });
		ratings.sort();

		for (var i = 0; i < ratings.length; i++)
		{
			var j = ratings[i];
			filter.push({ value: j+","+j, title: j });
		}
	},

	render: function()
	{
		this.$el.hide().html(this.layer(this.data));

		this.$(".carousel:first").find(".carousel-indicators li:first").addClass("active");
		this.$(".carousel:first").find(".carousel-inner .item:first").addClass("active");
		this.$(".carousel:first").carousel({ interval: 5000 });

		this.comment_carousel = this.$(".review_carousel.b");

		this.$(".truncate").each(function()
		{
			var n = $(this).data("truncate");

			var text = $(this).html();
			if (text.length < n) return;

			$(this).html(text.substr(0, n) + " ");

			$(this).append($("<a>").attr("href", "#").text("Read more").click(function() {
				$(this).parent().html(text);
			}));
		});

		this.$(".review_related img").tooltip();
		this.refreshComments();
		return this;
	},

	refreshComments: function()
	{
		var filterGender = parseInt(this.$(".filter1.value").data("value"),10);
		var filterAge = this.$(".filter2.value").data("value");
		var filterRating = this.$(".filter3.value").data("value").split(",");
		var filterSort = this.$(".filter4.value").data("value");

		switch (filterSort)
		{
			case "helpful":
				this.data.ratings.sort(function(a,b){ return parseInt(b.helpfulvotes,10) - parseInt(a.helpfulvotes,10); });
				break;

			case "rating":
				this.data.ratings.sort(function(a,b){ return parseInt(b.rating,10) - parseInt(a.rating,10); });
				break;
		}

		var cRatings = [];

		for (var i = 0; i < this.data.ratings.length; i++)
		{
			var inf = this.data.ratings[i];

			if (!(parseInt(inf.rating,10) >= filterRating[0] && parseInt(inf.rating,10) <= filterRating[1]))
				continue;

			if (filterAge != "All" && filterAge != inf.age.toLowerCase())
				continue;

			if (inf.gender.toLowerCase() == "male" && !(filterGender & 2))
				continue;

			if (inf.gender.toLowerCase() == "female" && !(filterGender & 1))
				continue;

			cRatings.push({
				title: inf.title,
				by: inf.customer,
				date: inf.date,
				verified: inf.isVerified=="false"?"Non-Verified Customer":"Verified Customer",
				rating: parseInt((100*parseFloat(inf.rating)/5),10)+"%",
				descr: inf.review,
				value: parseInt((100*parseFloat(inf.value)/5)/25,10)*25+"%",
				fit: parseInt((100*parseFloat(inf.meetsexpectations)/5)/25,10)*25+"%",
				quality: parseInt((100*parseFloat(inf.picturequality)/5)/25,10)*25+"%",
				satisfaction: parseInt((100*parseFloat(inf.features)/5)/25,10)*25+"%",
				styling: parseInt((100*parseFloat(inf.soundquality)/5)/25,10)*25+"%",
				age: inf.age,
				gender: inf.gender,
				ownership: inf.ownership,
				usage: inf.usage,
				city: inf.city
			});
		}

		this.comment_carousel.html(this.templates.comments({ ratings: cRatings }));

		this.comment_carousel.find(".carousel-indicators li:first").addClass("active");

		this.comment_carousel.find(".truncate").each(function()
		{
			var n = $(this).data("truncate");

			var text = $(this).html();
			if (text.length < n) return;

			$(this).html(text.substr(0, n) + " ");

			$(this).append($("<a>").attr("href", "#").text("Read more").click(function() {
				$(this).parent().html(text);
			}));
		});

		this.comment_carousel.find(".item:first").addClass("active");
		this.comment_carousel.find(".carousel").carousel({ interval:false });
	},

	show: function () {
		this.$el.show();
	},

	hide: function () {
		this.$el.remove();
	},

	hideWithCheck: function (e) {
		if ($(e.target).hasClass("review_layer")) this.hide();
	}
});

$.ajax ({ type: "get", async: false, url: "res/ratingsReviews.json", dataType: "json", success: function(result)
{
	window.ratings = result;
}});

$(function() {
	cart.init();
	$(".cart-items:visible").text (cart.getTotal ());
});
