<!--
nav_max: 1
-->
# Make root redirect to the right version

If you have locales or versions enabled, you need to decide what to do if someone tries to access your doc's root folder.

For instance, if you have your docs public folder as `<host>/docs`, every new version will land on `<host>/docs/<locale>/<version>/`. What should you do if someone tries to access `<host>/docs` then?

I can think of 3 options (there are likely more, but these are the main ones conceptually):

1. Have a static page on that path
1. Create an index page that points to the different locales and versions.
1. Redirect to the latest docs or a specific version.

In this guide, I will focus on Option 3, redirecting to the latest published version, as I think it's the simplest and best option.

## How to redirect using a static page only

There are ways to setup this redirect using your webserver, but as this is a static site let's do it the proper static way, using the [http-equiv](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections#html_redirections) meta tag.

This is what that tag looks like:
```html

<meta http-equiv="refresh" content="delay_time; URL=new_website_url" />


```

In theory, having only this tag in the page should do the trick, but let's be polite and write a proper page:

```html
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; URL=/docs/en" />
    <title>Page Redirection</title>
</head>
<body>
        If you are not redirected automatically, follow this <a href='/docs/en'>link</a>.
</body>
</html>
```

If you save this file in the `<public>/docs/` folder, it should start redirecting to your "default" locale "en". Good? Right? Right? Well...

It can be better. The approach above does work, and if you are happy with it maybe that's all you need. However, there are some issues with it:

- We are redirecting to the "locale" folder. If we also have versions enabled, we will have to provide a version index on that page.
- The default locale and public folder are not tied with your configuration. Although it's unlikely you are going to change those, it does make things more brittle.

So, let's do it the Shromp way!

## The shromp way

First, let's create a new template on `<site-theme>/templates` that will hold our redirect page with some extra goodies. Let's call it `redirect.hbs`.

```hbs
<html lang="{{locale}}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; URL={{baseUrl}}/{{locale}}/{{version}}" />
    <title>{{pageTitle}}</title>
</head>
<body>
    If you are not redirected automatically, follow this <a href='{{baseUrl}}/{{locale}}/{{version}}}}'>link</a>.
</body>
</html>
```
As this page goes through shromp, you have access to the locale and version being published, so you can skip the middle man and go directly to the latest docs.

Now you need to create the `/docs/index.md` content file. For this purpose, the content won't really matter, but make sure your metadata is pointing to the right template.

```markdown
<!--
template: redirect
-->
# Shromp page redirection
```

The last thing you need to do is make sure that the option `generate_doc_index` in your `shromp.toml` is set to true. This option is usually disabled so you don't unintentionally overwrite your index, but in this case, this is exactly what you want to do. 

Now run `shromp build` and test it out. When hitting `/docs` you should be redirected to the latest version.

That's how you do it! Of course, if you are using Shromp's default theme, it's already configured like that, but it's good to know how the magic happens.

