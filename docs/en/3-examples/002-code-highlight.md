<!--
nav_max: 1
-->
# Setting up syntax highlight for code blocks

You might have noticed how the code blocks in this site look so fancy:

```javascript

function whatDoYouMean() {
    return "I haven't even noticed!";
}


```

This is thanks to [PrismJS](https://prismjs.com/)! Setting it up is super easy, and if you are using the default template you've already got it. However, you might have noticed some missing syntax. Or maybe the colors are not what you were looking for.

So here goes some tips and tricks so you can setup PrismJS on your Shromp them.

## Language support and themes

For language support, you can select which languages you want included in your bundle [here](https://prismjs.com/download.html#themes=prism-tomorrow&languages=markup+css+clike+javascript).

At the bottom of that page you will have the option to download the JS and CSS for that. Save these files in your theme's assets folder and you are golden. Things should work out-of-the-box.

For theme, you can select one of the ones from prism's website, or you can find some extra ones in this [prism-themes](https://github.com/PrismJS/prism-themes) respository.

## Support light and dark mode

Unfortunately, none of these themes support light/dark mode, and they don't make use of CSS variables to make our lives easier.

I did go through the hassle of adapting the theme in the Shromp's site to use CSS variables. If you check this source code, you will find you can change these colours. However, they are based on the `Coy` theme, because I like the stripped background.

There is a simpler way to support light/dark mode, though. Go through the themes list and pick one for dark mode and one for light mode. You can also create them yourself if you have time to spare.

Create a CSS file to hold these styles. I have mine as prism.css.

If you are using my current light/dark mode implementation, paste the light mode first, then create a block like this and paste the dark mode version inside:

```css

/* light mode styles go here */

[data-theme="dark"] {
  /* dark mode styles go here */
}


```

If you don't have a theme switcher and just want to support the vanilla light/dark mode system, you can do the same by using these queries:

```css
@media (prefers-color-scheme: light) {
  /* light mode styles go here */
}

@media (prefers-color-scheme: dark) {
  /* dark mode styles go here */
}
```

With that, each mode will have its own theme.

## Line numbers plugin

If, like me, you like to have line numbers in your code block, you need to select the "line numbers" plugin when downloading prism.

You soon will notice that the line numbers don't work out-of-the-box. To make them work, add this to your footer or JS file.

```javascript
// this is required to support prism's line numbers
(function() {
	document.querySelectorAll('pre').forEach(function(el) {
		el.classList.add('line-numbers');
	});
}());
```
If you are using the default theme, this is already configured.

## Conclusion

This is how you configure syntax highlighting in Shromp using PrismJS. If you have questions or a better plugin for this, feel free to start a discussion on [Shromp's forum](https://github.com/viniciusgerevini/shromp/discussions).




