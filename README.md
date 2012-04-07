# DOMTracker - a module tracker for your web browser #
##### by Josh Matthews - josh@joshmatthews.net - (jdm@github) #####

This project is an attempt to create a fully-functioning, cross-browser MOD tracker in Javascript that
emulates the look and feel of [OpenMPT](http://www.modplug.com/trackerinfo.html). Currently, it only works by default in Firefox.

Special thanks to the authors of [jsmodplayer](https://github.com/sneilan/jsmodplayer) and
[audiolib.js](https://github.com/jussi-kalliokoski/audiolib.js) for allowing me to focus
on the UI instead of writing sound code.

sundance.mod by Purple Motion / Future Crew.

## TODO ##

**main editor**

- drag'n'drop patterns in position table
- repeated scrolling when holding down mouse button on position table buttons
- more keybindings, customizable keybindings
- channel solo/mute
- saving modules to offline storage
- saving modules to local machine
- export as wav
- loading module files (remote)
- optimize pattern redraw and update
- optimize selection redraw
- copy/cut/paste
- undo/redo
- informative display for effect/sample name under cursor
- more module file types? (oh noooooooooooooooooooooo)
- jsmodplayer improvements (1993.MOD shows significant problems)

**sample editor**

- sample select/cut/copy/paste
- importing samples (local/remote)
- saving samples
- edit sample metadata
- apply effects (amplify, reverse, etc.)
- modify/set loop points
