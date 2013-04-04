$(function()
{
	/* ************************************************************************************** */
	/* Model of a product. */
	var Product = Backbone.Model.extend ({

		defaults: function() {
			return {
				id: null,
				url: "",
				image: "images/blank.png",
				title: "",
				descr: "",
				size: 0,
				price: 0,
				list_price: 0,
				cents: 0,
				list_cents: 0,
				rating: "0%",
				ldescr: "",
				brand: "", type: "",
				with_discount: 0
			};
		}

	});

	/* Collection of products. */
	var ProductList = Backbone.Collection.extend ({

		model: Product,

		loadFrom: function (url)
		{
			var _this = this;

			$.ajax ({ type: "get", async: false, url: url, dataType: "json", success: function(result)
			{
				var itemdataset = [];
				window.itemdataset = itemdataset;

				for (var i = 0; i < result.length; i++)
				{
					var item = result[i];

					item = {
						url: item.url,
						image: item.image,
						title: item.name.substr(0, 1 + item.name.indexOf("\"")),
						descr: _.truncate(item.name.substr(2 + item.name.indexOf("\"")), 28),
						size: item.size,

						price: parseInt (item.price,10),
						cents: (item.price - parseInt(item.price,10)).toFixed(2).substr(1),

						list_price: parseInt (item.listPrice,10),
						list_cents: (item.listPrice - parseInt(item.listPrice,10)).toFixed(2).substr(1),

						with_discount: parseFloat(item.listPrice) != parseFloat(item.price),

						rating: 25*parseInt(((item.rating/5)*100)/25,10) + "%",
						brand: item.brand,
						type: item.type,
						ldescr: item.description,
						id: _.last(item.url.split("/"))
					};

					itemdataset.push(item);
					_this.add (item);
				}
			}});
		}

	});

	/* View for a single product. */
	var ProductView = Backbone.View.extend ({

		tagName:  "div",

		template: null,

		events: {
			"click img":  "viewItem"
		},

		initialize: function() {
			this.template = Handlebars.compile(_.loadTemplate("TVFinder/results/item"));
			this.listenTo(this.model, 'change', this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$("img").tooltip();
			return this;
		},

		clear: function() {
		  this.model.destroy();
		},

		viewItem: function() {
			var view;
			$("body").append((view = new ProductDetailsView({ model: this.model })).render().el);
			view.show();
		}

	});

	/* *************************************************************************************** */

	/* Model of a header. */
	var Header = Backbone.Model.extend ({

		defaults: function() {
			return {
				homeUrl: "http://www.walmart.com/",
				logo: "images/logo.png",
				searchPlaceholder: "Search",
				cartItems: 0
			};
		}

	});

	/* View for the header. */
	var HeaderView = Backbone.View.extend ({

		tagName:  "div",

		template: null,

		initialize: function() {
			this.template = Handlebars.compile(_.loadTemplate("Global/header"));
			this.listenTo(this.model, 'change', this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		clear: function() {
		  this.model.destroy();
		},

		focus: function () {
			this.$("input").focus();
		}
	});

	/* *************************************************************************************** */

	/* View for the breadcrumbs. */
	var BreadcrumbView = Backbone.View.extend ({

		tagName:  "div",

		template: null,

		initialize: function() {
			this.template = Handlebars.compile(_.loadTemplate("Global/breadcrumbs"));
			this.listenTo(this.model, 'change', this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		clear: function() {
		  this.model.destroy();
		}

	});

	/* *************************************************************************************** */

	/* View for the footer. */
	var FooterView = Backbone.View.extend ({

		tagName:  "div",

		template: null,

		initialize: function() {
			this.template = Handlebars.compile(_.loadTemplate("Global/footer"));
			this.listenTo(this.model, 'change', this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		clear: function() {
		  this.model.destroy();
		}

	});

	/* *************************************************************************************** */

	/* View for the results. */
	var ResultsView = Backbone.View.extend ({

		tagName:  "div",

		template: null,

		initialize: function() {
			this.template = Handlebars.compile(_.loadTemplate("TVFinder/results/content"));
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		clear: function() {
			this.$(".list").html("");
		},

		addProductView: function(product) {
			var view = new ProductView({model: product});
			this.$(".list").append(view.render().el);
		},

		matches: function(n) {
			this.$(".info > b > span").text(n);
		}
	});

	/* *************************************************************************************** */

	/* View for the page. */
	var PageView = Backbone.View.extend ({
		tagName:  "div",

		featuring: null,
		filters: null,
		results: null,
		footer: null,

		initialize: function() {
			this.featuring = Handlebars.compile(_.loadTemplate("TVFinder/content/featuring"));
			this.filters = Handlebars.compile(_.loadTemplate("TVFinder/content/filters"));

			this.results = new ResultsView({model:new Backbone.Model});
			this.results.render();

			this.footer = new FooterView({model:new Backbone.Model});
			this.footer.render();

			this.listenTo(this.model, 'change', this.render);

			this.$el.html("")
				.append(this.featuring(this.model.toJSON()))
				.append(this.filters(this.model.toJSON()))
				.append(this.results.el)
				.append(this.footer.el)
				;
		},

		render: function() {
			return this;
		},

		clear: function() {
		  this.model.destroy();
		},
		
		lazyload: function() {
			this.$("img").lazyload({ effect:"fadeIn", threshold:200 });
			$(window).trigger("scroll");
		}
	});

	/* *************************************************************************************** */

	/* View for the application. */
	var Application = Backbone.View.extend ({

		el: $("#appView"),

		range_min: 0,
		range_max: 0,
		range: [0, 0],
		noUpdate: false,

		header: null,
		pageView: null,

		events: {
			"keyup #searchbox": "runSearch",
			"click #clear-completed": "clearCompleted",
			"click #toggle-all": "toggleAllComplete",
			"click .btn-sign-up": "signUpMail",
			"keyup .btn-sign-up-txt": "signUpTxtCheckEnter",
			"click .btn-clear-filters": "clearFilters",
			"change #typeDropDownElement": "filterBrands",
			"change #brandDropDownElement": "listProducts",
			"change #sortDropDownElement": "listProducts"
		},

		runSearch: function (event)
		{
			if (event.keyCode == 13)
			{
				var term = this.$("#searchbox").val();

				if (/^[^&<>{}]*$/.test(term))
					window.location = "http://www.walmart.com/search/search-ng.do?search_query="+encodeURI(term);
				else
					alert("Please remove incorrect characters from your search term.");
			}
		},

		extractRangeFromProducts: function ()
		{
			this.range_min = null;
			this.range_max = null;

			for (var i = 0; i < this.products.length; i++)
			{
				this.range_min = this.range_min === null ? this.products.at(i).get("size") : Math.min (this.products.at(i).get("size"), this.range_min);
				this.range_max = this.range_max === null ? this.products.at(i).get("size") : Math.max (this.products.at(i).get("size"), this.range_max);
			}

			this.range_mid = parseInt((this.range_max + this.range_min) / 2,10);
		},

		filterTypes: function()
		{
			var data = { };

			for (var i = 0; i < this.products.length; i++)
			{
				var size = parseInt (this.products.at(i).get("size"),10);

				if (!(this.range[0] <= size && size <= this.range[1]))
					continue;

				data[this.products.at(i).get("type")] = true;
			}

			var lastValue = this.typeDropDown.val();

			this.typeDropDown.html("");

			this.typeDropDown.append($("<option>").val("All").text("All Types"));

			for (var j in data)
				this.typeDropDown.append($("<option>").val(j).text(j));

			this.typeDropDown.val(lastValue);
			if (this.typeDropDown.val() != lastValue) this.typeDropDown.val("All");
			this.typeDropDown.change();
		},

		filterBrands: function()
		{
			var data = { };
			var selectedType = this.$("#typeDropDownElement").val();

			for (var i = 0; i < this.products.length; i++)
			{
				var size = parseInt (this.products.at(i).get("size"),10);

				if (!(this.range[0] <= size && size <= this.range[1]))
					continue;

				if (selectedType != "All" && this.products.at(i).get("type") != selectedType)
					continue;

				data[this.products.at(i).get("brand")] = true;
			}

			var lastValue = this.brandDropDown.val();

			this.brandDropDown.html("");
			this.brandDropDown.append($("<option>").val("All").text("All Brands"));

			for (var j in data)
				this.brandDropDown.append($("<option>").val(j).text(j));

			this.brandDropDown.val(lastValue);
			if (this.brandDropDown.val() != lastValue) this.brandDropDown.val("All");
			this.brandDropDown.change();
		},

		signUpTxtCheckEnter: function(e)
		{
			if (e.keyCode == 13) this.signUpMail();
		},

		popup: function(url)
		{
			var wnd = window.open (url, "name", "height=550,width=550");
			if (wnd.focus) wnd.focus();
		},

		signUpMail: function()
		{
			var email = this.$(".btn-sign-up-txt").val();

			if (/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(email))
				this.popup("http://www.walmart.com/email_collect/thankyou_popup.gsp?conf_email="+encodeURI(email)+"&email_source_id=1178");
			else
				alert("Please specify a correct email address.");
		},

		clearFilters: function()
		{
			this.noUpdate = true;

			this.typeDropDown.val("All").change();
			this.brandDropDown.val("All").change();
			this.sortDropDown.val("price_asc").change();
			this.slider.trigger("setvals", { values: [this.range_mid-10, this.range_mid+10] } );

			this.noUpdate = false;
			this.listProducts();
		},

		initComps: function()
		{
			var _this = this;

			// Set direct accesses.
			this.typeDropDown = this.$("#typeDropDownElement");
			this.brandDropDown = this.$("#brandDropDownElement");
			this.sortDropDown = this.$("#sortDropDownElement");

			// Initialize special components.
			this.$(".selectpicker").selectpicker();

			this.slider = this.$("#size-slider").slider({
				animate: false, range: true, min: this.range_min,
				max: this.range_max, values: [0, 0],
				slide: function (event, ui) { return _this.sliderSlide(event, ui); }
			});

			this.slider.on("setvals", function (e, p) { _this.updateSlider(e, p); });
			this.slider.trigger("setvals", { values: [this.range_mid-10, this.range_mid+10] } );

			this.filterBrands();
		},

		updateSlider: function (e, params) {
			this.slider.slider("option", "values", params.values);
			this.slider.slider("option", "slide").call(this.slider, null, params);
		},

		sliderSlide: function (e, ui)
		{
			if (ui.values[0] > ui.values[1])
				return false;

			this.slider.find(".ui-slider-handle:eq(0)").attr("data-value", ui.values[0]);
			this.slider.find(".ui-slider-handle:eq(1)").attr("data-value", ui.values[1]);

			this.range[0] = ui.values[0];
			this.range[1] = ui.values[1];

			this.filterTypes();
		},

		initialize: function(x)
		{
			this.header = new Header;
			this.pageView = new PageView({ model: new Backbone.Model });
			this.headerView = new HeaderView({ model: this.header });

			this.$("#headerView").append(this.headerView.render().el);
			this.$("#breadcrumbView").append(new BreadcrumbView({ model: new Backbone.Model }).render().el);
			this.$("#pageView").append(this.pageView.render().el);

			this.products = new ProductList;
			this.products.loadFrom ("res/data.json");

			this.extractRangeFromProducts();
			this.initComps();

			this.headerView.focus();
		},

		render: function() {
			this.listProducts();
		},

		listProducts: function()
		{
			if (this.noUpdate == true)
				return;

			var selectedType = this.typeDropDown.val();
			var selectedBrand = this.brandDropDown.val();
			var selectedSort = this.sortDropDown.val();
			var sortFunction;

			switch (selectedSort)
			{
				case "price_asc":
					sortFunction = function(a,b) { return parseFloat(a.get("price")) - parseFloat(b.get("price")); };
					break;

				case "price_desc":
					sortFunction = function(a,b) { return parseFloat(b.get("price")) - parseFloat(a.get("price")); };
					break;

				case "ranking":
					sortFunction = function(a,b) { return parseFloat(b.get("rating")) - parseFloat(a.get("rating")); };
					break;

				case "size":
					sortFunction = function(a,b) { return parseFloat(b.get("size")) - parseFloat(a.get("size")); };
					break;
			}

			var rangeStart = this.range[0];
			var rangeEnd = this.range[1];

			var list = this.products.filter(function (item)
			{
				if (selectedType != "All" && item.get("type") != selectedType)
					return false;

				if (selectedBrand != "All" && item.get("brand") != selectedBrand)
					return false;

				if (!(rangeStart <= parseInt(item.get("size"),10) && parseInt(item.get("size"),10) <= rangeEnd))
					return false;

				return true;
			});

			list = list.sort(sortFunction);

			this.pageView.results.clear();

			for (var i = 0; i < list.length; i++)
				this.pageView.results.addProductView (list[i]);

			this.pageView.results.matches(list.length);
			this.pageView.lazyload();
		}
	});

	/* *************** */
	var app = new Application;
	app.render();

});
