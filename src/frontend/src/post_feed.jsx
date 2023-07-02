import * as React from "react";
import { bigScreen, isRoot, Loading, expandUser } from "./common";
import { Post } from "./post";

export const PostFeed = ({
    classNameArg = null,
    focusedPost,
    feedLoader,
    heartbeat,
    title,
    comments,
    thread,
    includeComments,
    grid,
    level,
    highlighted,
}) => {
    const [page, setPage] = React.useState(0);
    const [posts, setPosts] = React.useState([]);
    // this flag helps us avoid double loading of the data on the first rendering
    const [init, setInit] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [noMoreData, setNoMoreData] = React.useState(false);

    const loadPage = async (page) => {
        setLoading(true);
        let next_posts = (await feedLoader(page, includeComments)).map(
            expandUser
        );
        if (next_posts.length < backendCache.config.feed_page_size)
            setNoMoreData(true);
        const loaded = new Set(posts.map((post) => post.id));
        setPosts(
            page == 0
                ? next_posts
                : posts.concat(
                      next_posts.filter((post) => !loaded.has(post.id))
                  )
        );
        setLoading(false);
    };

    React.useEffect(() => {
        if (init) loadPage(page);
    }, [page]);
    React.useEffect(() => {
        setPage(0);
        setInit(true);
        loadPage(0);
    }, [heartbeat]);

    const itemRendering = (post, lastItem) => (
        <Post
            id={post.id}
            key={post.id}
            data={post}
            level={level}
            highlighted={highlighted}
            isFeedItem={true}
            classNameArg={`${
                !isRoot(post) && (comments || thread) ? "comment" : "feed_item"
            }`}
            focused={post.id == focusedPost}
            isCommentView={comments || thread}
            isThreadView={thread && !lastItem}
        />
    );

    const useGrid = grid && bigScreen() && api._user?.settings.columns != "off";
    let columnFeed = posts.map((item, i) =>
        itemRendering(item, i == posts.length - 1)
    );
    const gridFeed = <GridFeed posts={posts} itemRendering={itemRendering} />;

    return (
        <div className={classNameArg}>
            {title && title}
            {(!loading || page > 0) &&
                (useGrid && !comments ? gridFeed : columnFeed)}
            {loading && <Loading />}
            {!noMoreData && !loading && posts.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <button id="pageFlipper" onClick={() => setPage(page + 1)}>
                        MORE
                    </button>
                </div>
            )}
        </div>
    );
};

const GridFeed = ({ posts, itemRendering }) => {
    const columnLeft = posts.filter((_, i) => i % 2 == 0);
    const columnRight = posts.filter((_, i) => i % 2 == 1);
    return (
        <div className="row_container">
            <div className="grid_column" style={{ marginRight: "auto" }}>
                {columnLeft.map(itemRendering)}
            </div>
            <div className="grid_column" style={{ marginLeft: "auto" }}>
                {columnRight.map(itemRendering)}
            </div>
        </div>
    );
};
