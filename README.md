- The slider is simply a jQuery UI slider but it comes with the default style of jQuery UI. To override the default style I extended the 
(1) "ui-slider-handle" class which selects the slider handles
(2) "ui-slider" which describes the slider background (gray)
(3) "ui-slider-range" which describes the selected area in the slider.

- LazyLoad plugin has been implemented by loading the "js/jquery.lazyload.min.js" file. The actual usage is like to call all images in the results container like this: ui.find("img").lazyload({effect:"fadeIn"}); Which will cause all images in the container to be loaded whenever they are in the visible area of the window.

- Responsiveness is managed by bootstrap, what it does is simply to put columns stacked vertically when the screen resolution is too small to show columns horizontally. To actually use bootstrap the only required thing to do is to write all HTML structure in rows and columns using the bootstrap classes "row-fluid" and "span*".

- The top navigation bar was converted to an static-fixed-bar simply by adding the class "navbar-fixed-top" to the row that contains the header bar. The issue is that this causes the element to be fixed and therefore any content behind it is now shown, to fix this an empty div with a fixed height was added to compensate.

- Since I don't have a web service that returns filtered data and instead we have just an static json file this file is loaded entirely at first and stored in memory for further processing as follows:

	(a) The function populateSets() will take the global array "dataset" and obtain all unique TV types and brands, these are used to populate the drop-down boxes types and brands respectively which are found in the filtering box.
	(b) Four filtering controls are available "s_type", "s_brand", "s_sort" and "range". The later is an array with two values (low and high bounds) this is updated by the slide() event of the slider.
	(c) The dataset is sorted and then filtered simply by comparing the type, brand and size range and showing only those that match the filter.
	(d) Everytime a filter control changes (type, brand, sort, or the slider) the listProducts() function is called which will re-render the results.

- Validation of input fields is merely done with a regular expression.

- Resources used are only:

	(a) http://twitter.github.com/bootstrap/
	(b) http://jqueryui.com/
	(c) http://westciv.com/speakEasy/presentations/appcache/appcache-presentation.html


--------------

(*) To fix the navigation bar:
	(a) Find the comment "<!-- Dummy DIV to replace header. -->" and uncomment the DIV below that.
	(b) Find the DIV element with class "no-navbar-fixed-top" and replace with "navbar-fixed-top".
	(c) That's all.

-------------------------------------------------------
Part #2:

- The overlay was implemented as two parts, the background transparent layer which is a fixed DIV in
order to wrap the whole screen (this one has scroll bar enabled), and a content DIV which is inside the
first DIV.

- The design of the layer was made on a separate file first and then added as a DIV to the main index.

- All reviews are loaded at startup and then shown/sorted/filtered as requested by the user.

- Currently a cart object is kept in memory to manage the items and their counts.

- Problems faced where all design-issues, it's somewhat difficult to clone the exact same image as
specified in the image and ensuring all borders are actually where they're supposed to be. This was
fixed only by trial-and-error after a lot of time of testing.

- The main2.js file contains all the JS code used for the layer.

- One code-related issue is the carousel. It doesn't allow dynamic changes of the contents of it, so 
everytime a change is made to the contents of the carousel it has to be basically re-created from
scratch and converted to a carousel using bootstrap's .carousel() call.

- A "cart" object is used to store information about the cart, all data stored in this object is also
stored in the localStorage object.

- The "refreshComments" method of the ProductDetailsView filters the cached ratings and creates a new
array named "cRatings" with the filtered reviews, this is later used to let handlebars render the
carousel along with each page of comments.

- The blink of the cart items number is done using CSS (TVFinder css, class willblink). It uses the
CSS3 transitions to set the background. The javascript code simply sets and quits the "blink" class from
some element that will be blinked.
