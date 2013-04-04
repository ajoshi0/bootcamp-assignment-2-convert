var templates = { };

/* Add unique function. */
_.extractUnique = function (source, property)
{
	var array = [], temp = {};

	for (var i = 0; i < source.length; i++)
	{
		var value = (source[i][property] + "").toLowerCase();
		temp[value] = temp[value] ? temp[value] + 1 : 1;
		if (temp[value] == 1) array.push(value);
	}

	return array;
};

_.loadTemplate = function (name)
{
	var res;

	if (templates[name]) return templates[name];

	$.ajax ({ type: "get", async: false, url: "templates/"+name+".hbs" + "?r=" + Math.random(), dataType: "html", success: function(result) {
		res = result;
	}});

	return templates[name] = res;
};

_.toArray = function (map)
{
	var array = [];

	for (var name in map)
	{
		map[name].name = name;
		array.push (map[name]);
	}

	return array;
};

_.getInt = function (value)
{
	value = (value + "").trim();

	for (var i = 0; i < value.length; i++)
	{
		if (!/[0-9]/.test(value.substr(i, 1)))
		{
			if (i == 0) break;
			return parseInt(value.substr(0,i));
		}
	}

	return parseInt(value);
};

_.truncate = function (str, len)
{
	if (str.length > len)
		return str.substr(0, len) + "...";
	else
		return str;
};

/* Helper for array iteration. */
Handlebars.registerHelper("each2", function(context, options)
{
	var ret = "";

	for (var i = 0, j = context.length; i < j; i++)
		ret += options.fn({ index: i, value: context[i] });

	return ret;
});

/* Helper for object iteration with access to the index. */
Handlebars.registerHelper('each3', function(context, options)
{
	var ret = "";

	for (var i = 0, j = context.length; i < j; i++)
		ret += options.fn($.extend (context[i], { index: i }));

	return ret;
});

/* Returns only text of a possibly HTML string. */
Handlebars.registerHelper('justtext', function(str)
{
	return $("<span>").html(str).text();
});
