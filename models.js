var mongoose = require('mongoose'),
    path = require('path');

var TemplateSchema = new mongoose.Schema({
    template_name: { type: String, validate: [function(n) { return n.length > 0 }, 'Template must have a name'] },
    body: String
});

var PageSchema = new mongoose.Schema({
    // The path to the page within webroot. i.e. if webroot is '/webroot/' and
    // a page's .path is '/index.html', the page will be compiled and saved to
    // '/webroot/index.html'
    path: { type: String,
            // Validate that the path does not end with '/'. Since the set method will prepend '/' to
            // the path, this will return false if the path is empty as well as if it is a directory.
            validate: [function(p) { return p.charAt(p.length-1) != '/'; }, 'Page must have a path that is not a directory'],

            set: function(p) { return path.normalize('/' + p); } },

    // The Template that this page belongs to
    template: { type: mongoose.Schema.ObjectId, ref: 'Template' },

    // The page's title. Generally used in <title> and headers within the page
    title: String,

    // The contents of the page
    body: String
});

var MediaFileSchema = new mongoose.Schema({
    path: { type: String,
            validate: [function(p) { return p.charAt(p.length-1) != '/'; }, 'Static file must have a path that is not a directory'],
            set: function(p) { return path.normalize('/' + p); } },

    // The location where the uploaded file is stored
    // on the filesystem
    mediaFilePath: String
});

exports.Template = mongoose.model('Template', TemplateSchema);
exports.Page = mongoose.model('Page', PageSchema);
exports.MediaFile = mongoose.model('MediaFile', MediaFileSchema);
