import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
export default function Dashboard({setactivenav, isLoggedIn}) {
  const navigate = useNavigate();
  return (
    <div className="Hme">
      <div className="scoreboard">
        <div className="numbers numb1">
          <div className="numb">250+</div>
          <div className="numbOf">Courses by our mentors</div>
        </div>
        <div className="numbers numb2">
          <div className="numb">1000+</div>
          <div className="numbOf">Videos by our mentors</div>
        </div>
        <div className="numbers numb3">
          <div className="numb">15+</div>
          <div className="numbOf">Mentors</div>
        </div>
        <div className="numbers numb4">
          <div className="numb">2400+</div>
          <div className="numbOf">Students</div>
        </div>
      </div>

      <div className="startnowbox">
        <div className="startnowcontent">
          <div className="heading">
            Unlock Your Potential With
            <br />
            EduVid
          </div>
          <br />
          <div className="intro">
            Welcome to EduVid, where learning knows no bounds. We believe
            that education is the key to personal and professional growth, and
            we're here to guide you on your journey to success
          </div>
          <br />
          {!isLoggedIn && (<div className="strt" onClick={() => {
            setactivenav("Login"); 
            navigate("/Login")}}>Start your Journey</div>)}
        </div>
        <div className="startnowimg"></div>
      </div>
    </div>
  );
}
