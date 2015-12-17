const _fbBase = new Firebase('https://fake.firebaseio.com/');
const _fbComments = _fbBase.child('comments');

class CommentBox extends React.Component {
  constructor() {
    super();
    this.state = {data: []};
    this.handleCommentSubmit = this.handleCommentSubmit.bind(this);
    this.handleCommentDelete = this.handleCommentDelete.bind(this);
    this.loadCommentsFromServer = this.loadCommentsFromServer.bind(this);
  }

  loadCommentsFromServer() {
    let comments = [];
    _fbComments.orderByKey().once('value', (dataSnapshot) => {
      dataSnapshot.forEach((snapshot) => {
        comments.push(Object.assign({id: snapshot.key()}, snapshot.val()));
      });
      this.setState({data: comments});
    });
  }

  handleCommentSubmit(comment) {
    var comments = this.state.data;
    comments.push(Object.assign({id: Date.now()}, comment));
    _fbComments.push(comment);
    this.loadCommentsFromServer();
  }

  handleCommentDelete(key) {
    var comments = this.state.data;
    comments = comments.filter((comment) => comment.id !== key);
    this.setState({data: comments});
    _fbComments.child(key).remove();
    this.loadCommentsFromServer();
  }

  componentDidMount() {
    this.loadCommentsFromServer();
    console.log(this.props.pollInterval);
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  }

  render() {
    return(
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
        <CommentList data={this.state.data} onCommentDelete={this.handleCommentDelete} />
      </div>
    );
  }
}

class CommentList extends React.Component {
  render() {
    let commentNodes = this.props.data.map(comment => {
      return (
        <Comment author={comment.author} fbkey={comment.id} key={comment.id} onCommentDelete={this.props.onCommentDelete}>
          {comment.text}
        </Comment>
      );
    });
    return(
      <div className="commentList">
        {commentNodes}
      </div>
    )
  }
}

class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
  }

  _rawMarkup() {
    let rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  }

  handleDelete() {
    this.props.onCommentDelete(this.props.fbkey);
  }

  render() {
    return(
      <div className="comment">
        <h2 className="commentAuthor">
          <span onClick={this.handleDelete}><button>X</button></span> {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={this._rawMarkup()} />
      </div>
    )
  }
}

class CommentForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {author: '', text: ''};
    this.handleAuthorChange = this.handleAuthorChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleAuthorChange(e) {
    this.setState({author: e.target.value})
  }

  handleTextChange(e) {
    this.setState({text: e.target.value})
  }

  handleSubmit(e) {
    e.preventDefault();
    let author = this.state.author.trim();
    let text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  }

  render() {
    return(
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    )
  }
}

ReactDOM.render(<CommentBox pollInterval={1000}/>, document.getElementById('content'));
