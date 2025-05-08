<!--
nav_max: 1
-->
# Applying different styles to elements

Markdown is a lightweight markup language that focus on writing content in a clear extensible way. Using it to author a website comes with a few caveats, like not being able to set different styles/classes to elements.

From my point of view this is not an issue, as you shouldn't be concerned with styling when writing content. However, I understand there are cases where you would want elements to look slightly different, like, having a table with different colours, or an image aligned differently.

I could have "enhanced" my markdown support by allowing you to add more non-standard markdown notations that I would translate to the given style. However, I don't think this is a good idea, as one of my goals was for you to be able to read your docs in markdown, as well as you do in this website.

So here are some ideas how you can workaround these limitations and style elements differently.

## Using metadata to define different styles

In the [theming docs](../2-organisation/2-theme.md#custom-metadata), I cover the user of custom metadata to send information to your template. You can use those to define different styles to your page, without needing a different template.

For example, let's say in your "configurations" page you want a table that has the first column with bold text. In your template you can set a metadata like:
```markdown
<!--
extra_class: fancy-table
-->
```

In your template you can support this metadata by doing:

```hbs
<div class="content {{metadata.extra_class}}">
```
And your css could look like this:

```css
.content.fancy-table table td:nth-child(1) {
  font-weight: 600;
}
```

There are other clever ways you can use metadata to style specific elements, but I'll let you come up with your own patterns before the Shrimp police comes after me.

## Using css attributes

In some situations you already have all the info you need to define a different style. For example, you might have noticed that any external link in this site has an indicator [like this](https://thisisvini.com).

The way I achieved that is by abusing the fact that internal links are usually defined without the host name, like this `/docs/en/1.0.0/...` while external links start with `http...`.

I then defined a CSS rule using an [attribute selector](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors).

```css
.page-doc a[href^="http"]::after {
	content: ' \f08e';
	font-family: "fontello";
	font-size: 0.8em;
	vertical-align: middle;
	text-decoration: none;
}
```
Another example in this site is how merged columns in tables look like headers.

| This is a header | Another header |
| -----------------| -------------- |
| This is content | more content |
| This is a regular cell, but I make it look like a header ||
| more cells | more cells |

The way I achieve this is by using the "colspan" attribute which is used to merge cells:
```css
.page-doc table td[colspan="2"] {
	text-align: center;
	font-weight: 600;
	background-color: var(--table-head-color);
	border-top: 2px solid var(--table-border-color);
	border-bottom: 2px solid var(--table-border-color);
}
```
There are a few other elements like images and headings where you can play with attributes to define different styles. Give it a try.

## Using good ol' HTML tags

Shromp supports Github flavoured Markdown, which is not as strict as the standard markdown. This means you can sneak in some HTML tags in the code if you wish, with styles and all.

<p style="text-align: center; color: #bada33; font-weight: bold;">
    just like this super tastefull paragraph
</p>

Just be carefull this can be a slippery slope equivalent to a css `!import`. But I guess a custom class or two won't hurt. Your site, your rules.

## Using different templates

This solution sounds the lamest and the most obvious, but you can just define different templates for drastically different styles.

--------

I guess that's all! I think this gives you enough fuel to ~do some evil~ achieve your dreams! If you have more suggestions or need help with anyting, feel free to start a discussion on the [Shromp's forum](https://github.com/viniciusgerevini/shromp/discussions).
