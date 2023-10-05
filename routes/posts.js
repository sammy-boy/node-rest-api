const Post = require('../models/Post');
const User = require('../models/User');
const router = require('express').Router();

//create post
router.post('/', async (req, res) => {

    const newPost = new Post(req.body);
    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
});

// update post
router.put('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId || req.body.isAdmin) {
            await post.updateOne({
                $set: req.body,
            });
            res.status(200).json("Post updated successfully");
        } else {
            return res.status(403).json("You can update only your post");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

//delete post
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId || req.body.isAdmin) {
            await post.deleteOne();
            res.status(200).json("Post deleted successfully");
        } else {
            return res.status(403).json("You can delete only your post");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

//like-unlike post
router.put('/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const user = await User.findById(req.body.userId);

        !post && res.status(404).json("Post not found");
        !user && res.status(404).json("Something went wrong");

        if (!post.likes.includes(user.id)) {
            await post.updateOne({ $push: { likes: user.id } });
            res.status(200).json("Post has been liked");
        } else {
            await post.updateOne({ $pull: { likes: user.id } });
            res.status(200).json("Like removed from post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
})

//get post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // const { password, updatedAt, ...other } = post._doc //decide what not to be returned from the get document
        !post && res.status(404).json("Post not found");
        post && res.status(200).json(post);
    } catch (err) {
        return res.status(500).json(err);
    }
})

//timeline posts
router.get('/timeline/all', async (req, res) => {
    try {
        const currentUser = await User.findById(req.body.userId);
        const userPosts = await Post.find({ userId: currentUser.id });
        const friendPosts = await Promise.all( //use primise.all() because we'll use map, any loop should make use of promise all
            currentUser.followings.map((friendId) => { //foreach friend ID
                return Post.find({ userId: friendId})
            })
        ); 
        res.json(userPosts.concat(...friendPosts));
    } catch (err) {
        return res.status(500).json(err);
    }
})


module.exports = router;