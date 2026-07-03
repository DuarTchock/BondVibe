/**
 * Social layer — server-maintained aggregate counts.
 *
 * likeCount / commentCount on a post are written only here (Admin SDK), so
 * clients can't inflate them (rules block client writes to those fields).
 */
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/**
 * +1 when a subdoc is created, -1 when deleted, 0 otherwise.
 * @param {object} event the Firestore write event
 * @return {number} the count delta
 */
function countDelta(event) {
  const before = event.data?.before?.exists;
  const after = event.data?.after?.exists;
  if (!before && after) return 1;
  if (before && !after) return -1;
  return 0;
}

const onPostLikeWritten = onDocumentWritten(
  "posts/{postId}/likes/{likeUid}",
  async (event) => {
    const delta = countDelta(event);
    if (!delta) return;
    await db
      .collection("posts")
      .doc(event.params.postId)
      .set({likeCount: FieldValue.increment(delta)}, {merge: true});
  },
);

const onPostCommentWritten = onDocumentWritten(
  "posts/{postId}/comments/{commentId}",
  async (event) => {
    const delta = countDelta(event);
    if (!delta) return;
    await db
      .collection("posts")
      .doc(event.params.postId)
      .set({commentCount: FieldValue.increment(delta)}, {merge: true});
  },
);

module.exports = {onPostLikeWritten, onPostCommentWritten};
