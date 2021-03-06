var fs = require('fs'),
    path = require('path'),
    sys = require('sys'),
    exec = require('child_process').exec,

    hogan = require('hogan'),
    logger = require('log4js').getLogger(),

    models = require('./models.js'),
    config = require('./config.js').config,

    Page = models.Page,
    Template = models.Template,
    MediaFile = models.MediaFile;


/**
 * Generates the entire static site. Generates each static page and moves them
 * to webroot, copies all statics to webroot, and does everything else to compile
 * the entire site into webroot.
 */
exports.generateSite = function() {
    logger.info('Generating entire site into webroot: ' + config.webRoot);

    // Iterate through all Pages in the site and call generatePage() oneach
    Page.find({}, function(err, pages) {
        pages.forEach(function(page) {
            generatePage(page._id, config.webRoot);
        });
    });

    // Iterate through all media files in the site and call
    // generateMediaFile() on each
    MediaFile.find({}, function(err, mediaFiles) {
        mediaFiles.forEach(function(f) {
            generateMediaFile(f._id, config.webRoot);
        });
    });
};

/**
 * The inverse of generatePage. Takes the ObjectId of a Page and
 * deletes the generated static file for that page from disk.
 */
exports.deletePage = function(pageId, deletedCallback) {
    Page.findOne({'_id': pageId}, function(err, page) {
        fs.unlink(path.join(config.webRoot, page.path), function(err) {
            deletedCallback();
        });
    });
};

/**
 * The inverse of generateMediaFile. Takes the ObjectId of a
 * MediaFile and deletes that file from webroot.
 */
exports.deleteMediaFile = function(fileId, deletedCallback) {
    MediaFile.findOne({'_id': fileId}, function(err, file) {
        fs.unlink(path.join(config.webRoot, file.path), function(err) {
            deletedCallback();
        });
    });
};

/**
 * Compiles a static page and saves it to disk at config.webRoot + path. Expects that
 * the full path to file exists and is writable.
 *
 * path : The page's path relative to config.webRoot
 * template : A string containing the template contents
 * context : The template context
 */
var compileStaticPageToDisk = function(savePath, template, context) {
    var hoganTemplate = hogan.compile(template);
    var finalPageContent = hoganTemplate.render(context);

    fs.writeFile(path.join(config.webRoot, savePath), finalPageContent, function(err) {
        if (err) {
            logger.error('Failed to save page to path: ' + path.join(config.webRoot, savePath));
        }
    });
};

/**
 * Takes the ObjectId of a Page. Populates a template's context with that Page's
 * information and saves the resulting static file to webroot.
 */
var generatePage = function(pageId) {
    Page.findOne({'_id': pageId}).populate('template').run(function(err, page) {
        var templateContext = {'page': {
            'title': page.title,
            'body': page.body,
            'path': page.path,
        }};

        // Make sure the page's path exists. i.e. if the page's path is '/foo/bar/index.html',
        // run a mkdir on `webroot/foo/bar'
        exec('mkdir -p ' + path.join(config.webRoot, path.dirname(page.path)), function(mkdirErr, mkdirStdout, mkdirStderr) {
            if (mkdirErr) {
                logger.error('Failed to create path to static page: ' + path.join(config.webRoot, path.dirname(page.path))); // TODO
            }

            // Now compile the html file and save it to disk
            compileStaticPageToDisk(page.path, page.template.body, templateContext);
        });
    });
};

/**
 * Copies a media file from config.mediaUploadPath to webroot
 */
var generateMediaFile = function(fileId) {
    MediaFile.findOne({'_id': fileId}, function(err, file) {
        var finalPath = path.join(config.webRoot, file.path);

        // Make sure a path up to the media file's path in webroot exists
        exec('mkdir -p ' + path.dirname(finalPath), function(mkdirErr, mkdirStdout, mkdirStderr) {
            if (mkdirErr) {
                logger.error('Failed to create path to media file: ' + path.dirname(finalPath));
            }

            // Exec a `cp' command out of sheer laziness
            exec('cp ' + file.mediaFilePath + ' ' + finalPath, function(cpErr, cpStdout, cpStderr) {
                if (cpErr) {
                    logger.error('Failed to copy media file: "' + file.mediaFilePath + '" to "' + finalPath + '"');
                }
            });
        });
    });
};
