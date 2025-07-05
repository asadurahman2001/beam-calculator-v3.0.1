import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.offsetbox import OffsetImage, AnnotationBbox

def setup_page():
    """Set up the Streamlit page configuration."""
    st.set_page_config(layout="wide")
    st.title("Beam SFD, BMD & Deflection Calculator")

def get_beam_inputs():
    """Collect beam input parameters from the user."""
    col_a, col_b = st.columns([2, 3.6])
    
    with col_a:

        st.markdown("""
            <style>
            .stTabs [role="tablist"] {
                display: flex;
                justify-content: space-between;
                width: 100%;
            }
            .stTabs [role="tab"] {
                flex: 1;
                text-align: center;
            }
            </style>
        """, unsafe_allow_html=True)

        tab1, tab2, tab3, tab4 = st.tabs([" Length ", " Supports ", " Loads ", " Moments "])
        
        # Tab 1: Length
        with tab1:
            beam_length = st.number_input("Beam Length (m)", min_value=1.0, max_value=100.0, value=10.0, step=0.1, key="length")

        # Tab 2: Supports
        with tab2:
            support_types = ["Fixed", "Hinge", "Roller"]
            num_supports = st.number_input('Number of Supports', min_value=1, max_value=2, value=1)
            supports = []
            for i in range(int(num_supports)):
                col1, col2 = st.columns(2)
                with col1:
                    support_type = st.selectbox(
                        f"Support {i+1} type:",
                        support_types,
                        index=0,
                        key=f"support_type_{i}"
                    )
                with col2:
                    position = st.number_input(
                        f'Position of support {i+1} (m from left):',
                        min_value=0.0,
                        max_value=beam_length,
                        value=0.0 if i == 0 else beam_length,
                        step=1.0,
                        key=f"support_pos_{i}"
                    )
                supports.append((support_type, position))
        
        # Tab 3: Loads
        with tab3:
            st.write("#### Define Point Loads")
            num_point_loads = st.number_input(
                'Number of Point Loads',
                min_value=0,
                max_value=15,
                value=0
            )
            point_loads = []
            for i in range(int(num_point_loads)):
                col1, col2, col3 = st.columns([3, 2.5, 1])
                with col1:
                    position = st.number_input(
                        f"Point Load {i+1} position (m from left):",
                        min_value=0.0,
                        max_value=beam_length,
                        value=0.0,
                        step=1.0,
                        key=f"point_load_pos_{i}"
                    )
                with col2:
                    magnitude = st.number_input(
                        f"Point Load {i+1} magnitude (kN):",
                        value=0.0,
                        step=0.5,
                        key=f"point_load_mag_{i}"
                    )
                with col3:
                    upward_arrow = st.button("⬆️", key=f"upward_arrow_{i}")
                    downward_arrow = st.button("⬇️", key=f"downward_arrow_{i}")
                    if upward_arrow:
                        magnitude = abs(magnitude)
                    elif downward_arrow:
                        magnitude = -abs(magnitude)
                point_loads.append((position, magnitude))
            
            st.write("#### Define Distributed Loads")
            num_distributed_loads = st.number_input(
                "Number of Distributed Loads",
                min_value=0,
                max_value=3,
                value=0
            )
            distributed_loads = []
            for i in range(int(num_distributed_loads)):
                st.divider()
                col1, col2 = st.columns(2)
                with col1:
                    start_pos = st.number_input(
                        f"Distributed Load {i+1} starting position (m from left):",
                        min_value=0.0,
                        max_value=beam_length,
                        value=0.0,
                        step=1.0,
                        key=f"dist_load_start_{i}"
                    )
                    start_mag = st.number_input(
                        f"Distributed Load {i+1} start magnitude (kN/m):",
                        value=0.0,
                        step=0.5,
                        key=f"dist_load_start_mag_{i}"
                    )
                with col2:
                    end_pos = st.number_input(
                        f"Distributed Load {i+1} ending position (m from left):",
                        min_value=0.0,
                        max_value=beam_length,
                        value=beam_length,
                        step=1.0,
                        key=f"dist_load_end_{i}"
                    )
                    end_mag = st.number_input(
                        f"Distributed Load {i+1} end magnitude (kN/m):",
                        value=start_mag,
                        step=0.5,
                        key=f"dist_load_end_mag_{i}"
                    )
                distributed_loads.append((start_pos, end_pos, start_mag, end_mag))
        
        # Tab 4: Moments
        with tab4:
            st.write("#### Define Moments")
            num_moments = st.number_input(
                "Number of Moments:",
                min_value=0,
                max_value=3,
                value=0
            )
            moments = []
            for i in range(int(num_moments)):
                col1, col2 = st.columns(2)
                with col1:
                    moment_position = st.number_input(
                        f"Moment {i+1} position (m from left):",
                        min_value=0.0,
                        max_value=beam_length,
                        value=0.0,
                        step=1.0,
                        key=f"moment_pos_{i}"
                    )
                with col2:
                    moment_magnitude = st.number_input(
                        f"Moment {i+1} magnitude (kNm):",
                        value=0.0,
                        step=1.0,
                        key=f"moment_mag_{i}"
                    )
                moments.append((moment_position, moment_magnitude))
    
    return beam_length, supports, point_loads, distributed_loads, moments, col_b

def draw_beam(beam_length, supports, point_loads, distributed_loads, moments):
    """Draw the beam diagram with supports, loads, and moments."""
    fig, ax = plt.subplots(figsize=(12, 4))
    ax.plot([0, beam_length], [1, 1], 'b-', lw=2)
    ax.plot([0, beam_length], [-1, -1], 'b-', lw=2)

    ax.set_xlim(-beam_length * 0.03, beam_length * 1.03)
    ax.set_ylim(-16, 12)
    ax.get_yaxis().set_visible(False)
    ax.get_xaxis().set_visible(False)
    ax.axis('off')

    ax.fill_between(
        [0, beam_length],
        [1, 1],
        [-1, -1],
        color='blue',
        alpha=0.7
    )

    # Support icons
    fixed_left_icon_path = 'src/icons/fixed_support_left.png'
    fixed_right_icon_path = 'src/icons/fixed_support_right.png'
    hinge_icon_path = 'src/icons/hinge_support.png'
    roller_icon_path = 'src/icons/roller_support.png'

    hinge_icon = mpimg.imread(hinge_icon_path)
    fixed_icon_left = mpimg.imread(fixed_left_icon_path)
    fixed_icon_right = mpimg.imread(fixed_right_icon_path)
    roller_icon = mpimg.imread(roller_icon_path)

    for support_type, position in supports:
        if support_type == "Fixed":
            if position == beam_length:
                imagebox = OffsetImage(fixed_icon_right, zoom=0.5)
            else:
                imagebox = OffsetImage(fixed_icon_left, zoom=0.5)
            ab = AnnotationBbox(imagebox, (position, 0), frameon=False)
            ax.add_artist(ab)
        elif support_type == "Hinge":
            imagebox = OffsetImage(hinge_icon, zoom=0.3)
            ab = AnnotationBbox(imagebox, (position, -1.8), frameon=False)
            ax.add_artist(ab)
        elif support_type == "Roller":
            imagebox = OffsetImage(roller_icon, zoom=0.3)
            ab = AnnotationBbox(imagebox, (position, -1.8), frameon=False)
            ax.add_artist(ab)

    # Point Loads
    max_magnitude = max((abs(mag) for _, mag in point_loads), default=0)
    for position, magnitude in point_loads:
        if max_magnitude == 0:
            continue
        direction = 1 if magnitude > 0 else (-1 if magnitude < 0 else 0)
        if direction == 0:
            continue
        start_y = -2.2 * direction if magnitude > 0 else -2.2 * direction
        ax.arrow(
            position,
            start_y,
            0,
            direction * 0.01,
            head_width=0.2,
            head_length=1,
            fc='red',
            ec='red'
        )
        line_length = direction * max(0.3, (abs(magnitude) / max_magnitude) * 8)
        ax.plot([position, position], [start_y, -line_length], 'r-', lw=1.5)
        point_loads_text = -line_length - 1 if magnitude > 0 else -line_length + 0.05
        ax.text(position, point_loads_text, f'{abs(magnitude)} kN', color='red', ha='center')

    # Distributed Loads
    max_dist_magnitude = max((abs(mag) for _, _, mag1, mag2 in distributed_loads for mag in [mag1, mag2]), default=0)
    for start_pos, end_pos, start_mag, end_mag in distributed_loads:
        if max_dist_magnitude == 0:
            continue
        start_direction = 1 if start_mag > 0 else (-1 if start_mag < 0 else 0)
        end_direction = 1 if end_mag > 0 else (-1 if end_mag < 0 else 0)
        start_y = -2.2 * start_direction if start_direction != 0 else 0
        end_y = -2.2 * end_direction if end_direction != 0 else 0
        start_line_length = start_direction * max(0.3, (abs(start_mag) / max_dist_magnitude) * 8) if start_direction != 0 else 0
        end_line_length = end_direction * max(0.3, (abs(end_mag) / max_dist_magnitude) * 8) if end_direction != 0 else 0
        if start_direction != 0:
            ax.arrow(
                start_pos,
                start_y,
                0,
                start_direction * 0.01,
                head_width=0.2,
                head_length=1,
                fc='green',
                ec='green'
            )
        if end_direction != 0:
            ax.arrow(
                end_pos,
                end_y,
                0,
                end_direction * 0.01,
                head_width=0.2,
                head_length=1,
                fc='green',
                ec='green'
            )
        ax.plot([start_pos, start_pos], [start_y, -start_line_length], 'g-', lw=1.5)
        ax.plot([end_pos, end_pos], [end_y, -end_line_length], 'g-', lw=1.5)
        x_coords = [start_pos, start_pos, end_pos, end_pos]
        y_coords = [-start_line_length if start_direction != 0 else 0, -1 if start_direction > 0 else 1, -1 if end_direction > 0 else 1, -end_line_length if end_direction != 0 else 0]
        ax.fill(x_coords, y_coords, color='green', alpha=0.3)
        if start_direction != 0:
            start_pos_text = -start_line_length - 1 if start_mag > 0 else -start_line_length + 0.03
            ax.text(
                start_pos,
                start_pos_text,
                f'{abs(start_mag)} kN/m',
                color='green',
                ha='center'
            )
        if end_direction != 0:
            end_pos_text = -end_line_length - 1 if end_mag > 0 else -end_line_length + 0.03
            ax.text(
                end_pos,
                end_pos_text,
                f'{abs(end_mag)} kN/m',
                color='green',
                ha='center'
            )

    # Moments
    clockwise_moment_icon_path = 'src/icons/moment_clockwise.png'
    anticlockwise_moment_icon_path = 'src/icons/moment_anticlockwise.png'
    clockwise_moment_icon = mpimg.imread(clockwise_moment_icon_path)
    anticlockwise_moment_icon = mpimg.imread(anticlockwise_moment_icon_path)
    for moment_position, moment_magnitude in moments:
        if moment_magnitude > 0:
            imagebox = OffsetImage(clockwise_moment_icon, zoom=0.13)
            ab = AnnotationBbox(imagebox, (moment_position, 0.0), frameon=False)
            ax.add_artist(ab)
            ax.text(moment_position, 4, f'{abs(moment_magnitude)} kNm', color='black', ha='center')
        elif moment_magnitude < 0:
            imagebox = OffsetImage(anticlockwise_moment_icon, zoom=0.13)
            ab = AnnotationBbox(imagebox, (moment_position, 0), frameon=False)
            ax.add_artist(ab)
            ax.text(moment_position, 4, f'{abs(moment_magnitude)} kNm', color='black', ha='center')

    # Positions for dimensioning
    positions = []
    positions.extend([support[1] for support in supports])
    positions.extend([load[0] for load in point_loads])
    positions.extend([dist_load[0] for dist_load in distributed_loads])
    positions.extend([dist_load[1] for dist_load in distributed_loads])
    positions.extend([moment[0] for moment in moments])
    positions.append(0.0)
    positions.append(beam_length)
    positions = sorted(set(positions))

    # Dimension lines
    ax.plot([0, beam_length], [-12, -12], '-k', lw=1)
    dim_text_pos = 0
    for i in range(len(positions) - 1):
        ax.plot([positions[i], positions[i]], [-12.5, -10], '-k', lw=1)
        dim_text = positions[i + 1] - positions[i]
        formatted_dim_text = f"{dim_text:.2f}".rstrip('0').rstrip('.')
        dim_text_pos = positions[i]
        dim_text_pos += dim_text / 2
        ax.text(
            dim_text_pos,
            -11.5,
            f'{formatted_dim_text} m',
            color='black',
            ha='center'
        )
    ax.plot([beam_length, beam_length], [-12.5, -10], '-k', lw=1)

    return fig, positions

def calculate_reactions(supports, point_loads, distributed_loads, moments, beam_length):
    """Calculate reaction forces and moments at supports."""
    num_supports = len(supports)
    if num_supports == 1:
        for support_types, position in supports:
            if support_types == "Fixed":
                sum_point_loads = 0
                sum_dist_loads = 0
                sum_point_loads_moments = 0
                sum_dist_loads_moments = 0
                sum_external_moments = 0

                fixed_support_pos = position

                for position, magnitude in point_loads:
                    sum_point_loads += magnitude
                    sum_point_loads_moments += magnitude * abs(position - fixed_support_pos)

                for start_pos, end_pos, start_mag, end_mag in distributed_loads:
                    sum_dist_loads += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos))
                    if end_mag+start_mag != 0 :
                        centroid_left = ((abs(end_pos-start_pos))/3) * ((2*end_mag+start_mag)/(end_mag+start_mag))
                        centroid_right = abs(start_pos - end_pos) - centroid_left
                        distance_left = min(start_pos, end_pos)
                        distance_right = beam_length - max(start_pos, end_pos)
                        if fixed_support_pos == 0:
                            sum_dist_loads_moments += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos)) * (centroid_left+distance_left)
                        else:
                            sum_dist_loads_moments += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos)) * (centroid_right+distance_right)

                for position, magnitude in moments:
                    sum_external_moments += magnitude

                reaction_1 = -sum_point_loads - sum_dist_loads
                moment_1 = sum_point_loads_moments + sum_dist_loads_moments - sum_external_moments

                reaction_moment = [reaction_1, moment_1]
                reaction_moment_pos = []
                for support_types, position in supports:
                    reaction_moment_pos.append(position)
                reactions = []
                for i in reaction_moment:
                    reactions.append((reaction_moment_pos[0],i))

                reaction_direction ="🡻" if reactions[0][1] <0 else "🢁"
                st.write('✍️Reaction at Fixed Support: ', abs(round(reactions[0][1],2)), " kN ", reaction_direction)
                moment_direction = "Clockwise" if reactions[1][1] >0 else "Anticlockwise"
                st.write('✍️Moment at Fixed Support: ', abs(round(reactions[1][1],2)), ' kNm (', moment_direction, ' )')
                return reactions
            else:
                st.write("Unable to Solve")
                return False

    elif num_supports == 2:
        if any(support_type == "Fixed" for support_type, position in supports):
            st.write("Unable to Solve with Fixed Support and Two Supports")
            return False
        else:
            sum_point_loads = 0
            sum_dist_loads = 0
            sum_point_loads_moments = 0
            sum_dist_loads_moments = 0
            sum_external_moments = 0

            for position, magnitude in point_loads:
                sum_point_loads += magnitude
                sum_point_loads_moments += magnitude*(position)
            for start_pos, end_pos, start_mag, end_mag in distributed_loads:
                sum_dist_loads += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos))
                if end_mag+start_mag != 0 :
                    centroid_left = ((abs(end_pos-start_pos))/3) * ((2*end_mag+start_mag)/(end_mag+start_mag))
                    distance_left = min(start_pos, end_pos)
                    sum_dist_loads_moments += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos)) * (centroid_left+distance_left)

            for position, magnitude in moments:
                sum_external_moments += magnitude
            
            reaction_coefficient_mat = [(1,1)]
            support_position = []
            for support_type, position in supports:
                support_position.append(position)
            reaction_coefficient_mat.append(support_position)

            constant_mat = [(sum_point_loads + sum_dist_loads), (sum_point_loads_moments + sum_dist_loads_moments - sum_external_moments)]

            try:
                r = np.linalg.solve(reaction_coefficient_mat, constant_mat)
                r1, r2 = -r
            except np.linalg.LinAlgError:
                r1 = 0
                r2 = 0
                st.write("Unable to Solve: Singular Matrix")
                return False

        reaction_mag = [r1, r2]
        reaction_pos = []
        for support_types, position in supports:
            reaction_pos.append(position)
        reactions = []
        for a, b in zip(reaction_pos, reaction_mag):
            reactions.append((a,b))

        reactions = sorted(reactions, key=lambda x: x[0])
        reaction_direction_A ="🡻" if reactions[0][1] <0 else "🢁"
        st.write('✍️  Reaction at Support A: ', abs(round(reactions[0][1],2)), " kN ", " ", reaction_direction_A)
        reaction_direction_B ="🡻" if reactions[1][1] <0 else "🢁"
        st.write('✍️  Reaction at Support B: ', abs(round(reactions[1][1],2)), ' kN ', reaction_direction_B)
        
        return reactions
    else:
        st.write("Unsupported Number of Supports")
        return False

def shear_force(support_reactions, point_loads, distributed_loads, beam_length, resolution):
    """Calculate shear force along the beam."""
    shear = [0.0] * (int(beam_length * resolution) + 1)
    x_coords = np.linspace(0, beam_length, len(shear))

    # Add support reactions to shear force
    if support_reactions:
        for position, magnitude in support_reactions:
            for i, x in enumerate(x_coords):
                if x >= position:
                    shear[i] += magnitude

    # Add point loads to the shear force
    for position, magnitude in point_loads:
        for i, x in enumerate(x_coords):
            if x >= position:
                shear[i] += magnitude

    # Add distributed loads to the shear force
    for start_pos, end_pos, start_mag, end_mag in distributed_loads:
        for i, x in enumerate(x_coords):
            if start_pos <= x <= end_pos:
                load = start_mag + (end_mag - start_mag) * ((x - start_pos) / (end_pos - start_pos))
                increment = load * (x_coords[1] - x_coords[0])
                for j, y in enumerate(x_coords):
                    if y >= x:
                        shear[j] += increment

    return x_coords, shear

def bending_moment(supports, support_reactions, support_moments, point_loads, distributed_loads, external_moments, beam_length, resolution):
    """Calculate bending moment along the beam."""
    bending_moment = [0.0] * (int(beam_length * resolution) + 1)
    x_coords = np.linspace(0, beam_length, len(bending_moment))

    # Fixed support position
    fixed_support_pos = 0
    for support_types, position in supports:
        if support_types == "Fixed":
            fixed_support_pos = position

    # Add support reaction moments to bending moment
    if support_reactions:
        for position, magnitude in support_reactions:
            for i, x in enumerate(x_coords):
                if x >= position:
                    bending_moment[i] += magnitude * (x - position)

    # Add support moments to bending moment
    if support_moments:
        for position, magnitude in support_moments:
            for i, x in enumerate(x_coords):
                if x >= position:
                    if fixed_support_pos == 0:
                        bending_moment[i] += magnitude
                    else:
                        bending_moment[i] -= magnitude
    
    # Add point loads to the bending moment
    for position, magnitude in point_loads:
        for i, x in enumerate(x_coords):
            if x >= position:
                bending_moment[i] += magnitude * (x - position)
    
    # Add distributed loads to the bending moment
    for start_pos, end_pos, start_mag, end_mag in distributed_loads:
        for i, x in enumerate(x_coords):
            if start_pos <= x <= end_pos:
                load = start_mag + (end_mag - start_mag) * ((x - start_pos) / (end_pos - start_pos))
                increment = load * (x_coords[1] - x_coords[0])
                for j, y in enumerate(x_coords):
                    if y >= x:
                        bending_moment[j] += (y - x) * increment
    
    # Add external moments
    for position, magnitude in external_moments:
        for i, x in enumerate(x_coords):
            if x >= position:
                bending_moment[i] += magnitude

    # st.write(bending_moment)

    return x_coords, bending_moment

def calculate_reactions_for_unit_weight(supports, point_loads, distributed_loads, moments, beam_length):
    num_supports = len(supports)
    if num_supports == 1:
        for support_types, position in supports:
            if support_types == "Fixed":
                sum_point_loads = 0
                sum_dist_loads = 0
                sum_point_loads_moments = 0
                sum_dist_loads_moments = 0
                sum_external_moments = 0

                fixed_support_pos = position

                for position, magnitude in point_loads:
                    sum_point_loads += magnitude
                    sum_point_loads_moments += magnitude * abs(position - fixed_support_pos)

                for start_pos, end_pos, start_mag, end_mag in distributed_loads:
                    sum_dist_loads += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos))
                    if end_mag+start_mag != 0 :
                        centroid_left = ((abs(end_pos-start_pos))/3) * ((2*end_mag+start_mag)/(end_mag+start_mag))
                        centroid_right = abs(start_pos - end_pos) - centroid_left
                        distance_left = min(start_pos, end_pos)
                        distance_right = beam_length - max(start_pos, end_pos)
                        if fixed_support_pos == 0:
                            sum_dist_loads_moments += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos)) * (centroid_left+distance_left)
                        else:
                            sum_dist_loads_moments += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos)) * (centroid_right+distance_right)

                for position, magnitude in moments:
                    sum_external_moments += magnitude

                reaction_1 = -sum_point_loads - sum_dist_loads
                moment_1 = sum_point_loads_moments + sum_dist_loads_moments - sum_external_moments

                reaction_moment = [reaction_1, moment_1]
                reaction_moment_pos = []
                for support_types, position in supports:
                    reaction_moment_pos.append(position)
                reactions = []
                for i in reaction_moment:
                    reactions.append((reaction_moment_pos[0],i))

                return reactions

    elif num_supports == 2:
        if any(support_type == "Fixed" for support_type, position in supports):
            st.write("Unable to Solve with Fixed Support and Two Supports")
            return False
        else:
            sum_point_loads = 0
            sum_dist_loads = 0
            sum_point_loads_moments = 0
            sum_dist_loads_moments = 0
            sum_external_moments = 0

            for position, magnitude in point_loads:
                sum_point_loads += magnitude
                sum_point_loads_moments += magnitude*(position)
            for start_pos, end_pos, start_mag, end_mag in distributed_loads:
                sum_dist_loads += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos))
                if end_mag+start_mag != 0 :
                    centroid_left = ((abs(end_pos-start_pos))/3) * ((2*end_mag+start_mag)/(end_mag+start_mag))
                    distance_left = min(start_pos, end_pos)
                    sum_dist_loads_moments += 0.5 * (start_mag + end_mag) * (abs(end_pos-start_pos)) * (centroid_left+distance_left)

            for position, magnitude in moments:
                sum_external_moments += magnitude
            
            reaction_coefficient_mat = [(1,1)]
            support_position = []
            for support_type, position in supports:
                support_position.append(position)
            reaction_coefficient_mat.append(support_position)

            constant_mat = [(sum_point_loads + sum_dist_loads), (sum_point_loads_moments + sum_dist_loads_moments - sum_external_moments)]

            try:
                r = np.linalg.solve(reaction_coefficient_mat, constant_mat)
                r1, r2 = -r
            except np.linalg.LinAlgError:
                r1 = 0
                r2 = 0
                st.write("Unable to Solve: Singular Matrix")
                return False

        reaction_mag = [r1, r2]
        reaction_pos = []
        for support_types, position in supports:
            reaction_pos.append(position)
        reactions = []
        for a, b in zip(reaction_pos, reaction_mag):
            reactions.append((a,b))
        
        return reactions

def calculate_unit_load_moment(supports, beam_length, resolution):
    """Calculate the unit weight moment (bending moment due to unit load) at each point."""
    num_points = int(beam_length * resolution) + 1
    x_coords = np.linspace(0, beam_length, num_points)
    unit_weight_moments = np.zeros((num_points, num_points))  # Matrix to store m(x) for each unit load position

    for i in range(num_points):
        # Apply a unit load at x_coords[i]
        unit_load = [(x_coords[i], -1.0)]
        reactions = calculate_reactions_for_unit_weight(supports, unit_load, [], [], beam_length)
        
        # Separate reactions and moments
        support_reactions = []
        support_moments = []
        if reactions:
            if len(supports) == 1 and supports[0][0] == "Fixed":
                support_reactions = [(reactions[0][0], reactions[0][1])]
                support_moments = [(reactions[1][0], reactions[1][1])]
            else:
                support_reactions = reactions

        # Calculate bending moment due to this unit load
        _, unit_moment = bending_moment(
            supports, support_reactions, support_moments, unit_load, [], [], beam_length, resolution
        )
        unit_weight_moments[i, :] = unit_moment
    # st.write(unit_weight_moments)

    return x_coords, unit_weight_moments     

def calculate_deflection(x_coords, bending_moment, unit_weight_moments, beam_length, resolution, EI):
    num_points = len(x_coords)
    deflections = np.zeros(num_points)
    dx = beam_length / (num_points - 1)

    for i in range(num_points):
        # Sum over all j from 0 to i
        sum_deflection = 0.0
        for j in range(num_points):
            sum_deflection += bending_moment[j] * -unit_weight_moments[i][j] * dx
        deflections[i] = sum_deflection / (EI)  # Convert to mm
        

    return x_coords, deflections

def plot_sfd_bmd(x_coords, shear, bending_moment, deflections, positions, beam_length):
    """Plot Shear Force and Bending Moment Diagrams with annotations."""
    plt.style.use("ggplot")

    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(12, 15), gridspec_kw={"height_ratios": [1, 1, 1]})

    # Plot Shear Force Diagram (SFD)
    ax1.plot(x_coords, shear, color="blue", linewidth=2)
    ax1.fill_between(x_coords, shear, 0, color="blue", alpha=0.2)
    ax1.axhline(0, color="black", linewidth=1, linestyle="--")
    ax1.set_ylabel("Shear Force (kN)", fontsize=12)
    ax1.tick_params(axis="both", which="major", labelsize=10)
    ax1.set_xlim([0, beam_length])

    # Annotate zero shear position (approximate, near max bending moment)
    max_bending_idx = np.argmax(np.abs(bending_moment))
    max_bending_x = x_coords[max_bending_idx]
    ax1.annotate(
        f"x={max_bending_x:.2f}",
        (max_bending_x, shear[max_bending_idx]),
        textcoords="offset points",
        xytext=(0, 10),
        ha="center",
        fontsize=12,
        arrowprops=dict(facecolor="blue", arrowstyle="->", lw=0.5)
    )

    # Plot Bending Moment Diagram (BMD)
    ax2.plot(x_coords, bending_moment, color="green", linewidth=2)
    ax2.fill_between(x_coords, bending_moment, 0, color="green", alpha=0.2)
    ax2.axhline(0, color="black", linewidth=1, linestyle="--")
    ax2.set_xlabel("Beam Length (m)", fontsize=12)
    ax2.set_ylabel("Bending Moment (kNm)", fontsize=12)
    ax2.tick_params(axis="both", which="major", labelsize=10)
    ax2.set_xlim([0, beam_length])

    # Annotate maximum bending moment
    ax2.annotate(
        f"Max M\nx={x_coords[max_bending_idx]:.2f}\nM={bending_moment[max_bending_idx]:.2f}",
        (x_coords[max_bending_idx], bending_moment[max_bending_idx]),
        textcoords="offset points",
        xytext=(10, -20),
        ha="center",
        fontsize=12,
        arrowprops=dict(facecolor="green", arrowstyle="->", lw=0.5)
    )

     # Plot Shear Force Diagram (SFD)
    ax3.plot(x_coords, deflections, color="red", linewidth=2)
    ax3.fill_between(x_coords, deflections, 0, color="red", alpha=0.2)
    ax3.axhline(0, color="black", linewidth=1, linestyle="--")
    ax3.set_ylabel("Deflection (mm)", fontsize=12)
    ax3.tick_params(axis="both", which="major", labelsize=10)
    ax3.set_xlim([0, beam_length])

    # st.write(deflections)

    # Annotate SF and BM at specified positions
    for pos in positions:
        closest_idx = np.argmin(np.abs(x_coords - pos))
        ax1.annotate(
            f"{shear[closest_idx]:.2f}",
            (x_coords[closest_idx], shear[closest_idx]),
            textcoords="offset points",
            xytext=(10, 5),
            ha="center",
            fontsize=12,
            color="brown"
        )
        ax2.annotate(
            f"{bending_moment[closest_idx]:.2f}",
            (x_coords[closest_idx], bending_moment[closest_idx]),
            textcoords="offset points",
            xytext=(10, 5),
            ha="center",
            fontsize=12,
            color="brown"
        )
        ax1.axvline(x=x_coords[closest_idx], color="blue", linestyle="--", linewidth=0.5)
        ax2.axvline(x=x_coords[closest_idx], color="green", linestyle="--", linewidth=0.5)
        ax1.axvline(x=x_coords[max_bending_idx], color="blue", linestyle="--", linewidth=0.5)
        ax2.axvline(x=x_coords[max_bending_idx], color="green", linestyle="--", linewidth=0.5)

    fig.text(0.95, 0.0, 'Generated by Md. Asadur Rahman', ha='right', va='bottom', fontsize=10, color='black', alpha=0.6)
    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)

def display_bending_moment_table(x_coords, bending_moment, beam_length, interval=2.0):
    """
    Display a table of bending moments at every 'interval' meters along the beam.
    """
    table_data = []
    for i, x in enumerate(x_coords):
        # Show value at every interval and at the beam end
        if np.isclose(x % interval, 0, atol=1e-6) or np.isclose(x, beam_length, atol=1e-6):
            table_data.append({
                "Position (m)": round(x, 2),
                "Bending Moment (kNm)": round(bending_moment[i], 3)
            })
    if table_data:
        st.write(f"### Bending Moment Table (every {interval} meters)")
        st.table(table_data)

def display_unit_load_moment_matrix(x_coords, unit_weight_moments, beam_length, interval=2.0):
    """
    Display the unit load moment matrix at every 'interval' meters along the beam.
    """
    indices = [i for i, x in enumerate(x_coords) if np.isclose(x % interval, 0, atol=1e-6) or np.isclose(x, beam_length, atol=1e-6)]
    reduced_matrix = unit_weight_moments[np.ix_(indices, indices)]
    reduced_positions = [round(x_coords[i], 2) for i in indices]
    df_unit_moment = pd.DataFrame(reduced_matrix, index=reduced_positions, columns=reduced_positions)
    st.write(f"### Unit Load Moment Matrix (every {interval} meters)")
    st.dataframe(df_unit_moment)

def display_deflection_table(x_coords, deflections, beam_length, interval=2.0):
    """
    Display a table of deflections at every 'interval' meters along the beam.
    """
    table_data = []
    for i, x in enumerate(x_coords):
        if np.isclose(x % interval, 0, atol=1e-6) or np.isclose(x, beam_length, atol=1e-6):
            table_data.append({
                "Position (m)": round(x, 2),
                "Deflection (mm)": round(deflections[i]*1000, 4)  # Convert to mm if deflection is in meters
            })
    if table_data:
        st.write(f"### Deflection Table (every {interval} meters)")
        st.table(table_data)

def display_beam_diagram(col_b, beam_length, supports, point_loads, distributed_loads, moments):
    """Display the beam diagram in the right column."""
    with col_b:
        col_b1, col_b2 = st.columns([2,2])

        # Reaction and Resolution
        with col_b1:
            
            reactions = calculate_reactions(supports, point_loads, distributed_loads, moments, beam_length)
            resolution = st.number_input("Resolution (higher = more precision)", min_value=10, max_value=1000, value=100, step=10)
            
            

        with col_b2:
            E = st.number_input(
            "Young's Modulus E (kN/m²)",
            min_value=1e6,
            max_value=1e9,
            value=2e8,  # ~20 GPa for concrete
            step=1e6,
            format="%.0f"
        )
            I = st.number_input(
                "Moment of Inertia I (m⁴)",
                min_value=1e-8,
                max_value=1e-2,
                value=1e-4,  # Typical for a beam
                step=1e-8,
                format="%.8f"
            )
            EI = E * I  # Flexural rigidity in kNm²

        # Draw Beam
        fig, positions = draw_beam(beam_length, supports, point_loads, distributed_loads, moments)
        st.pyplot(fig)

        # SFD and BMD
        # Prepare data for shear force and bending moment
        support_reactions = []
        support_moments = []
        if reactions:
            if len(supports) == 1 and supports[0][0] == "Fixed":
                support_reactions = [(reactions[0][0], reactions[0][1])]
                support_moments = [(reactions[1][0], reactions[1][1])]
            else:
                support_reactions = reactions

        # Shear Force and Bending Moment Diagrams
        x_coords, shear = shear_force(support_reactions, point_loads, distributed_loads, beam_length, resolution)
        x_coords, moment = bending_moment(supports, support_reactions, support_moments, point_loads, distributed_loads, moments, beam_length, resolution)

        x_coords, unit_weight_moments = calculate_unit_load_moment(supports, beam_length, resolution)
        x_coords, deflections = calculate_deflection(x_coords, moment, unit_weight_moments, beam_length, resolution, EI)
        # st.write(deflections)

        plot_sfd_bmd(x_coords, shear, moment, deflections, positions, beam_length)

        # --- Bending Moment Table Section ---
        display_bending_moment_table(x_coords, moment, beam_length, interval=2.0)
        # --- Unit Load Moment Matrix Section ---
        display_unit_load_moment_matrix(x_coords, unit_weight_moments, beam_length, interval=2.0)
        # --- Deflection Table Section ---
        display_deflection_table(x_coords, deflections, beam_length, interval=2.0)


        return positions, reactions, resolution, moment

def main():
    """Main function to run the Streamlit app."""
    setup_page()
    beam_length, supports, point_loads, distributed_loads, moments, col_b = get_beam_inputs()
    positions, reactions, resolution, bending_moment = display_beam_diagram(col_b, beam_length, supports, point_loads, distributed_loads, moments)

if __name__ == "__main__":
    main()