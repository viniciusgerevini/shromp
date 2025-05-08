<!--
nav_max: 1
-->
# Pretty path, a.k.a removing .html from path

The modern internet made us hate extensions. Don't you miss the old days of `.php`, `.asp`, `.do`...

Alright! I went too far. I don't think the `.html` is a big deal, but some people do. So here are two ways you can get rid of them.

## Webserver configuration

If you are using a webserver there is definitely a way for you to use rewrites and avoid using the html extension.

If you are deploying to Github Pages, this is already a feature out-of-the-box. Having said that, at the time I'm writing this guide, Shromp's menu include the html extension and there is no built-in way to remove them during build. However, implementing a helper to do so should be straight forward.


## The static solution

If you played around with static sites enough you know that most webservers come configured in a way that they understand that `index.html` doesn't need to be explicitly added to the path. With this knowledge you can configure your files to benefit from that. For example:

If your content looks like this:

```text
 /en
   01-getting-started.md
   02-more-info.md
   03-about.md
   index.md
```

This will create the following files:

```text
 /en
   getting-started.html
   more-info.html
   about.html
   index.html
```

Which will have to be referenced by their full path, like `/en/getting-started.html`.

If you change your file structure to be like this:

```text
 /en
   01-getting-started/
    index.md
   02-more-info/
    index.md
   03-about/
    index.md
   index.md
```

Now the result will be:

```text
 /en
   getting-started/
    index.html
   more-info/
    index.html
   about/
    index.html
   index.html
```
So you can benefit from the feature I mentioned earlier and access your files like this `/en/getting-started`.

However, as I mentioned before, your navigation menu will still include the `index.html` paths. Writing a helper to solve this should be as simple as `navLnk.replace("index.html", "")`.

I understand this can be a bit cumbersome, so I'm thinking if it worth to add an option to do these changes as part of the shromp build process. Thumbs up if you want this feature!

Haaaa, gotcha!! You can't react here. So go to [Shromp's repo](https://github.com/viniciusgerevini/shromp) and star it to show your interest!
